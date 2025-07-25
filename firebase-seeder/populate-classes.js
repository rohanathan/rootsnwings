// populate-classes.js - Roots & Wings Classes Collection Seeder

// Import the Firebase Admin SDK
const admin = require('firebase-admin');
// Import Faker for generating mock data
const { faker } = require('@faker-js/faker');

// Import your service account key
const serviceAccount = require('./serviceAccountKey.json');

// ====================================================================================
// CONFIGURATION
// ====================================================================================
const BATCH_SIZE = 15;
const TARGET_CLASS_COUNT = 45; // Total classes to create
const CLASS_MIX = {
    workshops: 0.4,    // 40% - Single events
    batches: 0.4,      // 40% - Multi-week courses  
    oneOnOne: 0.2      // 20% - Individual sessions
};

// ====================================================================================
// INITIALIZE FIREBASE ADMIN SDK (Check if already initialized)
// ====================================================================================
let db;
try {
    db = admin.firestore();
    console.log('🚀 Using existing Firebase Admin SDK instance.');
} catch (error) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        db = admin.firestore();
        console.log('🚀 Firebase Admin SDK initialized successfully.');
    } catch (initError) {
        console.error('❌ Error initializing Firebase Admin SDK:', initError);
        process.exit(1);
    }
}

// ====================================================================================
// CLASS TEMPLATE DATA
// ====================================================================================

const WORKSHOP_TEMPLATES = [
    {
        titleFormat: 'Introduction to {subject}',
        duration: 120, // 2 hours
        description: 'A comprehensive introduction to {subject} fundamentals. Perfect for beginners looking to explore this exciting field.',
        level: 'beginner'
    },
    {
        titleFormat: '{subject} Masterclass',
        duration: 180, // 3 hours
        description: 'Intensive {subject} workshop for intermediate to advanced learners. Deep dive into advanced techniques.',
        level: 'intermediate'
    },
    {
        titleFormat: 'Weekend {subject} Workshop',
        duration: 240, // 4 hours
        description: 'Full-day {subject} intensive. Hands-on learning with plenty of practice time.',
        level: 'beginner'
    }
];

const BATCH_TEMPLATES = [
    {
        titleFormat: '{subject} Foundations Course',
        duration: 6, // weeks
        sessionsPerWeek: 2,
        description: '6-week comprehensive {subject} course. Build solid foundations with structured learning.',
        level: 'beginner'
    },
    {
        titleFormat: 'Advanced {subject} Program',
        duration: 8, // weeks  
        sessionsPerWeek: 2,
        description: '8-week intensive {subject} program for experienced learners ready to take their skills to the next level.',
        level: 'advanced'
    },
    {
        titleFormat: '{subject} Intensive Course',
        duration: 4, // weeks
        sessionsPerWeek: 3,
        description: '4-week intensive {subject} course. Fast-paced learning with frequent practice sessions.',
        level: 'intermediate'
    },
    {
        titleFormat: '{subject} Complete Journey',
        duration: 12, // weeks
        sessionsPerWeek: 2,
        description: '12-week comprehensive {subject} journey. From basics to proficiency with personalized guidance.',
        level: 'beginner'
    }
];

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const TIME_SLOTS = [
    { label: 'morning', slots: ['09:00', '10:00', '11:00'] },
    { label: 'afternoon', slots: ['14:00', '15:00', '16:00'] },
    { label: 'evening', slots: ['18:00', '19:00', '20:00'] }
];

// ====================================================================================
// HELPER FUNCTIONS
// ====================================================================================

/**
 * Generates a class-friendly public ID
 * Format: RW-C-2025-001 (Roots & Wings - Class - Year - Sequential)
 */
function generatePublicClassId(index) {
    const year = new Date().getFullYear();
    const paddedIndex = String(index + 1).padStart(3, '0');
    return `RW-C-${year}-${paddedIndex}`;
}

/**
 * Gets a date between 1-8 weeks from now
 */
function getRandomFutureDate() {
    const weeksAhead = faker.number.int({ min: 1, max: 8 });
    const date = new Date();
    date.setDate(date.getDate() + (weeksAhead * 7));
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

/**
 * Generates flexible batch schedule
 */
function generateBatchSchedule(template) {
    const duration = template.duration;
    const sessionsPerWeek = template.sessionsPerWeek;
    
    // Generate random day combinations
    const selectedDays = faker.helpers.arrayElements(
        DAYS_OF_WEEK.slice(0, 5), // Weekdays only for most batches
        { min: sessionsPerWeek, max: sessionsPerWeek }
    );
    
    // Pick a time slot
    const timeOfDay = faker.helpers.arrayElement(TIME_SLOTS);
    const startTime = faker.helpers.arrayElement(timeOfDay.slots);
    const endTime = `${parseInt(startTime.split(':')[0]) + 1}:${startTime.split(':')[1]}`;
    
    const startDate = getRandomFutureDate();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (duration * 7));
    
    return {
        duration: duration,
        startDate: startDate,
        endDate: endDate.toISOString().split('T')[0],
        weeklySchedule: selectedDays.map(day => ({
            day: day,
            startTime: startTime,
            endTime: endTime
        })),
        sessionsPerWeek: sessionsPerWeek,
        totalSessions: duration * sessionsPerWeek,
        sessionDuration: 60,
        timezone: 'Europe/London',
        schedulePattern: selectedDays.join('-'),
        timeOfDay: timeOfDay.label,
        intensity: sessionsPerWeek >= 4 ? 'intensive' : (sessionsPerWeek >= 2 ? 'regular' : 'relaxed')
    };
}

/**
 * Generates dynamic pricing with mentor discounts
 */
function generateDynamicPricing(mentorRate, totalSessions = 1, classType) {
    const perSessionRate = mentorRate;
    const subtotal = perSessionRate * totalSessions;
    
    // Mentor discount options (from dropdown simulation)
    const mentorDiscountOptions = [
        { label: '5% Multi-session', value: 5, type: 'percentage' },
        { label: '10% Package Deal', value: 10, type: 'percentage' },
        { label: '15% Bulk Discount', value: 15, type: 'percentage' },
        { label: '20% Premium Package', value: 20, type: 'percentage' }
    ];
    
    let mentorDiscount = null;
    let mentorDiscountAmount = 0;
    
    // Apply mentor discount for multi-session classes
    if (totalSessions > 1) {
        mentorDiscount = faker.helpers.arrayElement(mentorDiscountOptions);
        if (mentorDiscount.type === 'percentage') {
            mentorDiscountAmount = subtotal * (mentorDiscount.value / 100);
        } else {
            mentorDiscountAmount = mentorDiscount.value;
        }
    }
    
    // Platform discounts
    const earlyBirdAmount = faker.datatype.boolean({ probability: 0.4 }) ? 
        faker.number.float({ min: 5, max: 15, precision: 0.50 }) : 0;
    
    const firstTimeAmount = faker.datatype.boolean({ probability: 0.3 }) ? 
        faker.number.float({ min: 10, max: 20, precision: 0.50 }) : 0;
    
    const totalDiscounts = mentorDiscountAmount + earlyBirdAmount + firstTimeAmount;
    const finalPrice = Math.max(subtotal - totalDiscounts, subtotal * 0.1); // Minimum 10% of original price
    
    return {
        perSessionRate: perSessionRate,
        totalSessions: totalSessions,
        subtotal: parseFloat(subtotal.toFixed(2)),
        currency: 'GBP',
        
        discounts: {
            ...(mentorDiscount && {
                mentorDiscount: {
                    type: mentorDiscount.type,
                    value: mentorDiscount.value,
                    amount: parseFloat(mentorDiscountAmount.toFixed(2)),
                    reason: mentorDiscount.label
                }
            }),
            
            ...(earlyBirdAmount > 0 && {
                earlyBird: {
                    type: 'fixed_amount',
                    value: earlyBirdAmount,
                    amount: parseFloat(earlyBirdAmount.toFixed(2)),
                    validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks
                    condition: 'booking_before_deadline'
                }
            }),
            
            ...(firstTimeAmount > 0 && {
                firstTime: {
                    type: 'fixed_amount',
                    value: firstTimeAmount,
                    amount: parseFloat(firstTimeAmount.toFixed(2)),
                    condition: 'student_first_booking'
                }
            })
        },
        
        totalDiscounts: parseFloat(totalDiscounts.toFixed(2)),
        finalPrice: parseFloat(finalPrice.toFixed(2)),
        
        // For mentor interface dropdown
        suggestedDiscounts: mentorDiscountOptions
    };
}

/**
 * Creates search metadata for classes
 */
function createSearchMetadata(classData, schedule) {
    const availableDays = schedule.weeklySchedule ? 
        schedule.weeklySchedule.map(s => s.day) : [];
    
    const timeSlots = schedule.weeklySchedule ? 
        schedule.weeklySchedule.map(s => `${s.startTime}-${s.endTime}`) : [];
    
    return {
        availableDays: availableDays,
        timeSlots: timeSlots,
        timeOfDay: schedule.timeOfDay ? [schedule.timeOfDay] : [],
        intensity: schedule.intensity || 'regular',
        weeksDuration: schedule.duration || 0,
        totalTimeCommitment: schedule.totalSessions || 1,
        pricePerSession: classData.pricing.perSessionRate,
        pricePerHour: classData.pricing.perSessionRate,
        totalPackagePrice: classData.pricing.finalPrice,
        hasDiscount: classData.pricing.totalDiscounts > 0,
        difficultyLevel: classData.level,
        prerequisites: [],
        isOnline: classData.format === 'online',
        isInPerson: classData.format === 'in-person',
        supportsRecording: classData.format === 'online',
        
        searchTags: [
            classData.subject,
            classData.level,
            classData.type,
            ...(schedule.timeOfDay ? [`${schedule.timeOfDay}-classes`] : []),
            ...(schedule.intensity ? [`${schedule.intensity}-pace`] : []),
            ...(schedule.duration ? [`${schedule.duration}-weeks`] : []),
            classData.format,
            ...(classData.pricing.totalDiscounts > 0 ? ['discounted'] : [])
        ]
    };
}

// ====================================================================================
// DATA READING FUNCTIONS
// ====================================================================================

/**
 * Reads all mentors from users collection
 */
async function getAllMentors() {
    console.log('📖 Reading mentors from users collection...');
    
    const usersSnapshot = await db.collection('users')
        .where('roles', 'array-contains', 'mentor')
        .get();
    
    const mentors = [];
    usersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.mentorProfile && userData.mentorProfile.status === 'approved') {
            mentors.push({
                id: doc.id,
                ...userData
            });
        }
    });
    
    console.log(`✅ Found ${mentors.length} approved mentors`);
    return mentors;
}

/**
 * Reads all subjects from subjects collection
 */
async function getAllSubjects() {
    console.log('📚 Reading subjects from subjects collection...');
    
    const subjectsSnapshot = await db.collection('subjects').get();
    const subjects = {};
    
    subjectsSnapshot.forEach(doc => {
        subjects[doc.id] = doc.data();
    });
    
    console.log(`✅ Found ${Object.keys(subjects).length} subjects`);
    return subjects;
}

// ====================================================================================
// CLASS CREATION FUNCTIONS
// ====================================================================================

/**
 * Creates a workshop class
 */
function createWorkshop(mentor, subject, subjectData, template, index) {
    const publicId = generatePublicClassId(index);
    const workshopDate = getRandomFutureDate();
    const startTime = faker.helpers.arrayElement(
        faker.helpers.arrayElement(TIME_SLOTS).slots
    );
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = startHour + Math.floor(template.duration / 60);
    const endTime = `${endHour.toString().padStart(2, '0')}:${startTime.split(':')[1]}`;
    
    const title = template.titleFormat.replace('{subject}', subjectData.name);
    const description = template.description.replace(/{subject}/g, subjectData.name);
    
    const pricing = generateDynamicPricing(mentor.mentorProfile.pricing.oneOnOneRate, 1, 'workshop');
    
    const schedule = {
        date: workshopDate,
        startTime: startTime,
        endTime: endTime,
        timezone: 'Europe/London',
        duration: template.duration
    };
    
    return {
        classId: `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        publicId: publicId,
        type: 'workshop',
        
        // Basic Information
        title: title,
        description: description,
        subject: subject,
        category: subjectData.category,
        
        // Mentor Information (Denormalized)
        mentorId: mentor.id,
        mentorName: mentor.displayName,
        mentorPhotoURL: mentor.photoURL,
        mentorRating: mentor.mentorProfile.stats.avgRating,
        
        // Learning Details
        level: template.level,
        ageGroup: faker.helpers.arrayElement(['teen', 'adult', 'mixed']),
        skillPrerequisites: faker.helpers.arrayElements(
            subjectData.commonSpecializations || [], 
            { min: 0, max: 2 }
        ),
        
        // Pricing
        pricing: pricing,
        
        // Schedule
        schedule: schedule,
        
        // Capacity & Enrollment
        capacity: {
            maxStudents: faker.number.int({ min: 8, max: 20 }),
            minStudents: faker.number.int({ min: 3, max: 5 }),
            currentEnrollment: faker.number.int({ min: 0, max: 3 }),
            waitlistCount: 0
        },
        
        // Format & Location
        format: faker.helpers.arrayElement(['online', 'in-person']),
        location: {
            type: 'online',
            details: {
                platform: 'Google Meet',
                meetingLink: null,
                requiresApp: false
            }
        },
        
        // Learning Materials
        materials: {
            required: faker.helpers.arrayElements([
                'Notebook and pen', 'Computer/tablet', 'Stable internet connection'
            ], { min: 2, max: 3 }),
            provided: ['Digital handouts', 'Practice exercises'],
            recommended: ['Recording device (optional)']
        },
        
        // Learning Outcomes
        objectives: faker.helpers.arrayElements(
            subjectData.commonGoals || [`Learn ${subjectData.name} basics`], 
            { min: 2, max: 4 }
        ),
        
        // Class Status & Admin Approval
        status: faker.helpers.arrayElement([
            'pending_approval', 'approved', 'approved', 'approved' // 75% approved
        ]),
        
        approvalWorkflow: {
            submittedAt: admin.firestore.FieldValue.serverTimestamp(),
            submittedBy: mentor.id,
            reviewedBy: null,
            reviewedAt: null,
            reviewStatus: 'pending',
            adminNotes: null,
            adminChecks: {
                scheduleReasonable: null,
                pricingAppropriate: null,
                contentQuality: null,
                mentorQualified: null,
                capacityRealistic: null
            }
        },
        
        // Recurring Information
        isRecurring: false,
        parentClassId: null,
        
        // Tags & Categorization  
        tags: [subject, template.level, 'workshop', 'single-session'],
        keywords: [subjectData.name, template.level, 'workshop', 'single session'],
        
        // Search Metadata
        searchMetadata: createSearchMetadata({
            subject, level: template.level, type: 'workshop',
            format: 'online', pricing
        }, schedule),
        
        // Communication
        hasGroupChat: false,
        groupChatId: null,
        announcementsEnabled: true,
        
        // Analytics
        analytics: {
            viewCount: faker.number.int({ min: 5, max: 50 }),
            bookingConversionRate: faker.number.float({ min: 0.1, max: 0.4, precision: 0.01 }),
            averageRating: null,
            completionRate: null
        },
        
        // Metadata
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        publishedAt: null,
        lastBookingAt: null
    };
}

/**
 * Creates a batch class (multi-week course)
 */
function createBatch(mentor, subject, subjectData, template, index) {
    const publicId = generatePublicClassId(index);
    const schedule = generateBatchSchedule(template);
    const title = template.titleFormat.replace('{subject}', subjectData.name);
    const description = template.description.replace(/{subject}/g, subjectData.name);
    
    const pricing = generateDynamicPricing(
        mentor.mentorProfile.pricing.groupRate, 
        schedule.totalSessions, 
        'batch'
    );
    
    return {
        classId: `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        publicId: publicId,
        type: 'batch',
        
        // Basic Information
        title: title,
        description: description,
        subject: subject,
        category: subjectData.category,
        
        // Mentor Information (Denormalized)
        mentorId: mentor.id,
        mentorName: mentor.displayName,
        mentorPhotoURL: mentor.photoURL,
        mentorRating: mentor.mentorProfile.stats.avgRating,
        
        // Learning Details
        level: template.level,
        ageGroup: faker.helpers.arrayElement(['teen', 'adult', 'mixed']),
        skillPrerequisites: faker.helpers.arrayElements(
            subjectData.commonSpecializations || [], 
            { min: 0, max: 2 }
        ),
        
        // Pricing
        pricing: pricing,
        
        // Schedule (Flexible batch scheduling)
        schedule: schedule,
        
        // Capacity & Enrollment
        capacity: {
            maxStudents: faker.number.int({ min: 6, max: 12 }),
            minStudents: faker.number.int({ min: 3, max: 4 }),
            currentEnrollment: faker.number.int({ min: 0, max: 2 }),
            waitlistCount: 0
        },
        
        // Format & Location
        format: faker.helpers.arrayElement(['online', 'in-person', 'hybrid']),
        location: {
            type: 'online',
            details: {
                platform: 'Google Meet',
                meetingLink: null,
                requiresApp: false
            }
        },
        
        // Learning Materials
        materials: {
            required: faker.helpers.arrayElements([
                'Dedicated practice time', 'Notebook for exercises', 'Computer/tablet'
            ], { min: 2, max: 3 }),
            provided: ['Weekly handouts', 'Progress tracking sheets', 'Group chat access'],
            recommended: ['Recording device', 'Extra practice materials']
        },
        
        // Learning Outcomes
        objectives: faker.helpers.arrayElements(
            subjectData.commonGoals || [`Master ${subjectData.name} fundamentals`], 
            { min: 3, max: 5 }
        ),
        
        // Class Status & Admin Approval
        status: faker.helpers.arrayElement([
            'pending_approval', 'approved', 'approved', 'approved' // 75% approved
        ]),
        
        approvalWorkflow: {
            submittedAt: admin.firestore.FieldValue.serverTimestamp(),
            submittedBy: mentor.id,
            reviewedBy: null,
            reviewedAt: null,
            reviewStatus: 'pending',
            adminNotes: null,
            adminChecks: {
                scheduleReasonable: null,
                pricingAppropriate: null,
                contentQuality: null,
                mentorQualified: null,
                capacityRealistic: null
            }
        },
        
        // Recurring Information
        isRecurring: true,
        parentClassId: null,
        
        // Tags & Categorization
        tags: [subject, template.level, 'batch', 'multi-week', schedule.intensity],
        keywords: [
            subjectData.name, template.level, 'course', 'multi-week', 
            `${schedule.duration}-weeks`, schedule.schedulePattern
        ],
        
        // Search Metadata
        searchMetadata: createSearchMetadata({
            subject, level: template.level, type: 'batch',
            format: 'online', pricing
        }, schedule),
        
        // Communication
        hasGroupChat: true,
        groupChatId: `chat_${publicId.toLowerCase()}`,
        announcementsEnabled: true,
        
        // Analytics
        analytics: {
            viewCount: faker.number.int({ min: 10, max: 80 }),
            bookingConversionRate: faker.number.float({ min: 0.05, max: 0.25, precision: 0.01 }),
            averageRating: null,
            completionRate: null
        },
        
        // Metadata
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        publishedAt: null,
        lastBookingAt: null
    };
}

/**
 * Creates a 1-on-1 session template
 */
function createOneOnOne(mentor, subject, subjectData, index) {
    const publicId = generatePublicClassId(index);
    const title = `${subjectData.name} - Personal Mentoring`;
    const description = `One-on-one ${subjectData.name} sessions tailored to your individual goals and learning pace. Flexible scheduling available.`;
    
    const pricing = generateDynamicPricing(mentor.mentorProfile.pricing.oneOnOneRate, 1, 'one-on-one');
    
    return {
        classId: `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        publicId: publicId,
        type: 'one-on-one',
        
        // Basic Information
        title: title,
        description: description,
        subject: subject,
        category: subjectData.category,
        
        // Mentor Information (Denormalized)
        mentorId: mentor.id,
        mentorName: mentor.displayName,
        mentorPhotoURL: mentor.photoURL,
        mentorRating: mentor.mentorProfile.stats.avgRating,
        
        // Learning Details
        level: 'mixed', // 1-on-1 can adapt to any level
        ageGroup: 'mixed',
        skillPrerequisites: [],
        
        // Pricing
        pricing: pricing,
        
        // Schedule (Flexible scheduling)
        schedule: {
            isFlexible: true,
            sessionDuration: 60,
            advanceBookingRequired: 24,
            cancellationPolicy: '24_hours',
            availableDays: mentor.mentorProfile.availability.generallyAvailable,
            availableTimeSlots: [mentor.mentorProfile.availability.preferredHours]
        },
        
        // Capacity & Enrollment
        capacity: {
            maxStudents: 1, // 1-on-1 sessions
            minStudents: 1,
            currentEnrollment: 0,
            waitlistCount: 0
        },
        
        // Format & Location
        format: faker.helpers.arrayElement(['online', 'in-person', 'both']),
        location: {
            type: 'flexible',
            details: {
                platform: 'Google Meet',
                canMeetInPerson: mentor.location.city,
                requiresApp: false
            }
        },
        
        // Learning Materials
        materials: {
            required: ['Specific goals/topics you want to cover'],
            provided: ['Personalized lesson plan', 'Custom exercises', 'Progress tracking'],
            recommended: ['Practice materials based on your level']
        },
        
        // Learning Outcomes
        objectives: [
            'Personalized learning plan',
            'Individual attention and feedback',
            'Flexible pace and content',
            'Goal-oriented sessions'
        ],
        
        // Class Status & Admin Approval
        status: faker.helpers.arrayElement([
            'pending_approval', 'approved', 'approved', 'approved' // 75% approved
        ]),
        
        approvalWorkflow: {
            submittedAt: admin.firestore.FieldValue.serverTimestamp(),
            submittedBy: mentor.id,
            reviewedBy: null,
            reviewedAt: null,
            reviewStatus: 'pending',
            adminNotes: null,
            adminChecks: {
                scheduleReasonable: null,
                pricingAppropriate: null,
                contentQuality: null,
                mentorQualified: null,
                capacityRealistic: null
            }
        },
        
        // Recurring Information
        isRecurring: false,
        parentClassId: null,
        
        // Tags & Categorization
        tags: [subject, 'one-on-one', 'personal', 'flexible'],
        keywords: [subjectData.name, 'personal tutor', 'individual lessons', 'flexible'],
        
        // Search Metadata
        searchMetadata: createSearchMetadata({
            subject, level: 'mixed', type: 'one-on-one',
            format: 'flexible', pricing
        }, { timeOfDay: 'flexible', intensity: 'personal' }),
        
        // Communication
        hasGroupChat: false,
        groupChatId: null,
        announcementsEnabled: false,
        
        // Analytics
        analytics: {
            viewCount: faker.number.int({ min: 15, max: 100 }),
            bookingConversionRate: faker.number.float({ min: 0.2, max: 0.6, precision: 0.01 }),
            averageRating: null,
            completionRate: null
        },
        
        // Metadata
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        publishedAt: null,
        lastBookingAt: null
    };
}

// ====================================================================================
// POPULATION FUNCTION
// ====================================================================================

/**
 * Populates the 'classes' collection with realistic classes linked to real mentors
 */
async function populateClasses() {
    console.log('🎯 Starting to populate classes collection...');
    
    // Read existing data
    const [mentors, subjects] = await Promise.all([
        getAllMentors(),
        getAllSubjects()
    ]);
    
    if (mentors.length === 0) {
        console.error('❌ No approved mentors found! Run populate-users.js first.');
        return;
    }
    
    if (Object.keys(subjects).length === 0) {
        console.error('❌ No subjects found! Run populate-subjects.js first.');
        return;
    }
    
    console.log(`\n📊 Planning ${TARGET_CLASS_COUNT} classes:`);
    console.log(`- Workshops: ${Math.floor(TARGET_CLASS_COUNT * CLASS_MIX.workshops)}`);
    console.log(`- Batches: ${Math.floor(TARGET_CLASS_COUNT * CLASS_MIX.batches)}`);
    console.log(`- 1-on-1: ${Math.floor(TARGET_CLASS_COUNT * CLASS_MIX.oneOnOne)}\n`);
    
    const classesCollection = db.collection('classes');
    let classesCreated = 0;
    let globalIndex = 0;
    
    const allClasses = [];
    
    // Generate workshops
    const workshopCount = Math.floor(TARGET_CLASS_COUNT * CLASS_MIX.workshops);
    for (let i = 0; i < workshopCount; i++) {
        const mentor = faker.helpers.arrayElement(mentors);
        const mentorSubjects = mentor.mentorProfile.subjects || [];
        
        if (mentorSubjects.length > 0) {
            const subject = faker.helpers.arrayElement(mentorSubjects);
            const subjectData = subjects[subject] || { 
                name: subject, 
                category: 'other',
                commonGoals: [`Learn ${subject}`, `Master ${subject} basics`],
                commonSpecializations: [subject]
            };            const template = faker.helpers.arrayElement(WORKSHOP_TEMPLATES);
            
            const workshop = createWorkshop(mentor, subject, subjectData, template, globalIndex);
            allClasses.push(workshop);
            globalIndex++;
        }
    }
    
    // Generate batches
    const batchCount = Math.floor(TARGET_CLASS_COUNT * CLASS_MIX.batches);
    for (let i = 0; i < batchCount; i++) {
        const mentor = faker.helpers.arrayElement(mentors);
        const mentorSubjects = mentor.mentorProfile.subjects || [];
        
        if (mentorSubjects.length > 0) {
            const subject = faker.helpers.arrayElement(mentorSubjects);
            const subjectData = subjects[subject] || { 
                name: subject, 
                category: 'other',
                commonGoals: [`Learn ${subject}`, `Master ${subject} basics`],
                commonSpecializations: [subject]
            };            const template = faker.helpers.arrayElement(BATCH_TEMPLATES);
            
            const batch = createBatch(mentor, subject, subjectData, template, globalIndex);
            allClasses.push(batch);
            globalIndex++;
        }
    }
    
    // Generate 1-on-1 sessions
    const oneOnOneCount = Math.floor(TARGET_CLASS_COUNT * CLASS_MIX.oneOnOne);
    for (let i = 0; i < oneOnOneCount; i++) {
        const mentor = faker.helpers.arrayElement(mentors);
        const mentorSubjects = mentor.mentorProfile.subjects || [];
        
        if (mentorSubjects.length > 0) {
            const subject = faker.helpers.arrayElement(mentorSubjects);
            const subjectData = subjects[subject] || { 
                name: subject, 
                category: 'other',
                commonGoals: [`Learn ${subject}`, `Master ${subject} basics`],
                commonSpecializations: [subject]
            };            
            const oneOnOne = createOneOnOne(mentor, subject, subjectData, globalIndex);
            allClasses.push(oneOnOne);
            globalIndex++;
        }
    }
    
    // Batch write all classes
    console.log(`📦 Writing ${allClasses.length} classes to Firestore...`);
    
    for (let i = 0; i < allClasses.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const batchLimit = Math.min(i + BATCH_SIZE, allClasses.length);
        
        console.log(`📝 Processing batch: classes ${i + 1} to ${batchLimit}`);
        
        for (let j = i; j < batchLimit; j++) {
            const classData = allClasses[j];
            const docRef = classesCollection.doc(); // Auto-generate document ID
            batch.set(docRef, classData);
        }
        
        try {
            await batch.commit();
            classesCreated += (batchLimit - i);
            console.log(`✅ Successfully committed batch. Total classes created: ${classesCreated}/${allClasses.length}`);
            
            // Small delay between batches
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            console.error('❌ Error committing batch:', error);
        }
    }
    
    console.log(`\n🎉 Population complete! Successfully created ${classesCreated} classes.`);
    
    // Print summary statistics
    console.log('\n📊 Summary:');
    console.log(`- All classes linked to real mentors from users collection`);
    console.log(`- Classes match mentor subjects and expertise`);
    console.log(`- Flexible scheduling: Mon-Wed-Fri, Tue-Thu, etc.`);
    console.log(`- Dynamic pricing with mentor discounts applied`);
    console.log(`- 75% classes pre-approved, 25% pending admin review`);
    console.log(`- Public IDs: RW-C-2025-001, RW-C-2025-002, etc.`);
    console.log(`- Ready for student booking and admin approval workflow!\n`);
    
    // Print class type breakdown
    const workshops = allClasses.filter(c => c.type === 'workshop').length;
    const batches = allClasses.filter(c => c.type === 'batch').length;
    const oneOnOnes = allClasses.filter(c => c.type === 'one-on-one').length;
    
    console.log('🎨 Class Types Created:');
    console.log(`  📋 Workshops: ${workshops}`);
    console.log(`  🎓 Batches: ${batches}`);
    console.log(`  👤 1-on-1 Sessions: ${oneOnOnes}`);
}

// ====================================================================================
// SCRIPT EXECUTION
// ====================================================================================

// Run the population script
populateClasses()
    .then(() => {
        console.log('\n🚀 Classes population completed successfully!');
        process.exit(0);
    })
    .catch(error => {
        console.error("💥 An unexpected error occurred:", error);
        process.exit(1);
    });