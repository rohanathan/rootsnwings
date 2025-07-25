// populate-bookings.js - Roots & Wings Bookings Subcollection Seeder

// Import the Firebase Admin SDK
const admin = require('firebase-admin');
// Import Faker for generating mock data
const { faker } = require('@faker-js/faker');

// Import your service account key
const serviceAccount = require('./serviceAccountKey.json');

// ====================================================================================
// CONFIGURATION
// ====================================================================================
const BATCH_SIZE = 20;
const TARGET_BOOKING_COUNT = 75; // Total bookings to create
const BOOKING_STATUS_MIX = {
    confirmed: 0.75,    // 75% - Successfully booked and paid
    pending: 0.15,      // 15% - Awaiting payment or confirmation
    cancelled: 0.10     // 10% - Cancelled bookings
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
// HELPER FUNCTIONS
// ====================================================================================

/**
 * Generates a booking-friendly public ID
 * Format: RW-B-2025-001 (Roots & Wings - Booking - Year - Sequential)
 */
function generatePublicBookingId(index) {
    const year = new Date().getFullYear();
    const paddedIndex = String(index + 1).padStart(3, '0');
    return `RW-B-${year}-${paddedIndex}`;
}

/**
 * Gets a realistic booking date (classes booked 1-30 days ago)
 */
function getRealisticBookingDate() {
    const daysAgo = faker.number.int({ min: 1, max: 30 });
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
}

/**
 * Calculates final booking price with applied discounts
 */
function calculateBookingPrice(classPricing, studentProfile) {
    let finalPrice = classPricing.finalPrice;
    const appliedDiscounts = [...(classPricing.discounts ? Object.values(classPricing.discounts) : [])];
    
    // Add first-time student discount if applicable
    if (studentProfile && studentProfile.completedSessions === 0) {
        const firstTimeDiscount = {
            type: 'first_time_student',
            amount: faker.number.float({ min: 5, max: 15, precision: 0.50 }),
            description: 'New student welcome discount'
        };
        appliedDiscounts.push(firstTimeDiscount);
        finalPrice = Math.max(finalPrice - firstTimeDiscount.amount, finalPrice * 0.1);
    }
    
    return {
        basePrice: classPricing.subtotal,
        discountsApplied: appliedDiscounts,
        finalPrice: parseFloat(finalPrice.toFixed(2)),
        currency: 'GBP'
    };
}

/**
 * Creates scheduled slots for batch classes
 */
function createScheduledSlots(classData) {
    if (classData.type !== 'batch') return [];
    
    const schedule = classData.schedule;
    const slots = [];
    
    const startDate = new Date(schedule.startDate);
    const endDate = new Date(schedule.endDate);
    
    // Generate all session dates
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();        
        // Check if this day is in the weekly schedule
        const daySchedule = schedule.weeklySchedule.find(s => s.day === dayName);
        if (daySchedule) {
            slots.push({
                date: date.toISOString().split('T')[0],
                startTime: daySchedule.startTime,
                endTime: daySchedule.endTime,
                status: 'confirmed'
            });
        }
    }
    
    return slots;
}

/**
 * Selects appropriate young learner for parent booking
 */
function selectYoungLearner(parentUser) {
    if (!parentUser.parentProfile || !parentUser.parentProfile.youngLearnerCount) {
        return null;
    }
    
    // Simulate selecting one of the parent's children
    const learnerNames = ['Emma', 'Oliver', 'Sophia', 'Lucas', 'Ava', 'Noah', 'Isabella', 'Liam'];
    const learnerName = faker.helpers.arrayElement(learnerNames);
    
    return {
        youngLearnerId: `learner_${parentUser.publicId}_${learnerName.toLowerCase()}`,
        youngLearnerName: `${learnerName} ${parentUser.displayName.split(' ')[1]}` // Use parent's last name
    };
}

// ====================================================================================
// DATA READING FUNCTIONS
// ====================================================================================

/**
 * Reads all students and parents from users collection
 */
async function getAllStudentsAndParents() {
    console.log('📖 Reading students and parents from users collection...');
    
    const usersSnapshot = await db.collection('users')
        .where('accountStatus', '==', 'active')
        .get();
    
    const students = [];
    const parents = [];
    
    usersSnapshot.forEach(doc => {
        const userData = { id: doc.id, ...doc.data() };
        
        if (userData.roles.includes('student')) {
            students.push(userData);
        }
        if (userData.roles.includes('parent')) {
            parents.push(userData);
        }
    });
    
    console.log(`✅ Found ${students.length} students and ${parents.length} parents`);
    return { students, parents };
}

/**
 * Reads all approved classes
 */
async function getAllApprovedClasses() {
    console.log('📚 Reading approved classes from classes collection...');
    
    const classesSnapshot = await db.collection('classes')
        .where('status', '==', 'approved')
        .get();
    
    const classes = [];
    classesSnapshot.forEach(doc => {
        classes.push({
            id: doc.id,
            ...doc.data()
        });
    });
    
    console.log(`✅ Found ${classes.length} approved classes`);
    return classes;
}

// ====================================================================================
// BOOKING CREATION FUNCTIONS
// ====================================================================================

/**
 * Creates a workshop booking
 */
function createWorkshopBooking(student, classData, index, youngLearner = null) {
    const publicId = generatePublicBookingId(index);
    const bookedAt = getRealisticBookingDate();
    const pricing = calculateBookingPrice(classData.pricing, student.studentProfile);
    const status = faker.helpers.weightedArrayElement([
        { weight: BOOKING_STATUS_MIX.confirmed, value: 'confirmed' },
        { weight: BOOKING_STATUS_MIX.pending, value: 'pending' },
        { weight: BOOKING_STATUS_MIX.cancelled, value: 'cancelled' }
    ]);
    
    return {
        bookingId: `booking_${student.publicId}_${classData.publicId}`,
        publicId: publicId,
        
        // Student Information (Denormalized)
        studentId: student.id,
        studentName: student.displayName,
        studentEmail: student.email,
        studentPhotoURL: student.photoURL,
        
        // Young Learner (if applicable)
        ...(youngLearner && {
            youngLearnerId: youngLearner.youngLearnerId,
            youngLearnerName: youngLearner.youngLearnerName
        }),
        
        // Booking Details
        bookingStatus: status,
        paymentStatus: status === 'confirmed' ? 'paid' : (status === 'pending' ? 'pending' : 'refunded'),
        paymentId: status === 'confirmed' ? `payment_${publicId.toLowerCase()}` : null,
        
        // Pricing Breakdown
        pricing: pricing,
        
        // Schedule (Single workshop session)
        scheduledSlots: [
            {
                date: classData.schedule.date,
                startTime: classData.schedule.startTime,
                endTime: classData.schedule.endTime,
                status: status === 'cancelled' ? 'cancelled' : 'confirmed'
            }
        ],
        
        // Learning Customization
        personalGoals: faker.helpers.arrayElements([
            'Learn fundamentals', 'Explore new skills', 'Try something different',
            'Build confidence', 'Creative expression', 'Personal enrichment'
        ], { min: 1, max: 2 }).join(', '),
        
        specialRequests: faker.datatype.boolean({ probability: 0.3 }) ? 
            faker.helpers.arrayElement([
                'Please speak slowly, English is second language',
                'First time trying this subject',
                'Looking forward to learning!',
                'Hope to continue with regular classes',
                'Any beginner tips would be appreciated'
            ]) : '',
            
        accessibilityNeeds: [],
        
        // Communication Preferences
        allowGroupChat: faker.datatype.boolean({ probability: 0.8 }),
        preferredContactMethod: faker.helpers.arrayElement(['email', 'sms', 'app_notification']),
        
        // Attendance & Progress (for completed workshops)
        attendanceRecord: status === 'confirmed' && bookedAt < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) ? [
            {
                sessionDate: classData.schedule.date,
                status: faker.helpers.arrayElement(['present', 'present', 'present', 'absent']), // 75% attendance
                notes: faker.helpers.arrayElement([
                    'Great enthusiasm and participation',
                    'Asked thoughtful questions',
                    'Needs more practice but good start',
                    'Very engaged throughout session'
                ])
            }
        ] : [],
        
        // Feedback (for completed sessions)
        studentRating: null, // Will be set post-completion
        studentReview: null,
        mentorNotes: status === 'confirmed' ? faker.helpers.arrayElement([
            'Enthusiastic learner, great potential',
            'Needs encouragement but making progress',
            'Natural talent, recommended for advanced classes',
            'Would benefit from regular practice'
        ]) : '',
        
        // Metadata
        bookedAt: admin.firestore.Timestamp.fromDate(bookedAt),
        confirmedAt: status === 'confirmed' ? admin.firestore.Timestamp.fromDate(bookedAt) : null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        completedAt: null
    };
}

/**
 * Creates a batch enrollment
 */
function createBatchEnrollment(student, classData, index, youngLearner = null) {
    const publicId = generatePublicBookingId(index);
    const bookedAt = getRealisticBookingDate();
    const pricing = calculateBookingPrice(classData.pricing, student.studentProfile);
    const status = faker.helpers.weightedArrayElement([
        { weight: BOOKING_STATUS_MIX.confirmed, value: 'confirmed' },
        { weight: BOOKING_STATUS_MIX.pending, value: 'pending' },
        { weight: BOOKING_STATUS_MIX.cancelled, value: 'cancelled' }
    ]);
    
    const scheduledSlots = createScheduledSlots(classData);
    
    return {
        bookingId: `booking_${student.publicId}_${classData.publicId}`,
        publicId: publicId,
        
        // Student Information (Denormalized)
        studentId: student.id,
        studentName: student.displayName,
        studentEmail: student.email,
        studentPhotoURL: student.photoURL,
        
        // Young Learner (if applicable)
        ...(youngLearner && {
            youngLearnerId: youngLearner.youngLearnerId,
            youngLearnerName: youngLearner.youngLearnerName
        }),
        
        // Booking Details
        bookingStatus: status,
        paymentStatus: status === 'confirmed' ? 'paid' : (status === 'pending' ? 'pending' : 'refunded'),
        paymentId: status === 'confirmed' ? `payment_${publicId.toLowerCase()}` : null,
        
        // Pricing Breakdown
        pricing: pricing,
        
        // Schedule (All batch sessions)
        scheduledSlots: scheduledSlots,
        
        // Learning Customization
        personalGoals: faker.helpers.arrayElements([
            'Build solid foundation', 'Develop consistent practice habits',
            'Learn with others', 'Structured learning path', 'Long-term skill development',
            'Connect with community', 'Challenge myself'
        ], { min: 2, max: 3 }).join(', '),
        
        specialRequests: faker.datatype.boolean({ probability: 0.4 }) ? 
            faker.helpers.arrayElement([
                'Please focus on fundamentals',
                'Looking for structured learning',
                'Hope to make friends in the group',
                'First time in a group class',
                'Excited for the full course experience'
            ]) : '',
            
        accessibilityNeeds: [],
        
        // Communication Preferences
        allowGroupChat: faker.datatype.boolean({ probability: 0.95 }), // Higher for batch classes
        preferredContactMethod: faker.helpers.arrayElement(['email', 'app_notification']),
        
        // Attendance & Progress (for ongoing batches)
        attendanceRecord: status === 'confirmed' ? 
            scheduledSlots.slice(0, faker.number.int({ min: 0, max: Math.min(3, scheduledSlots.length) }))
                .map(slot => ({
                    sessionDate: slot.date,
                    status: faker.helpers.arrayElement(['present', 'present', 'present', 'absent']), // 75% attendance
                    notes: faker.helpers.arrayElement([
                        'Active participation in group activities',
                        'Good progress, keeping up well',
                        'Helpful to other group members',
                        'Shows improvement each session'
                    ])
                })) : [],
        
        // Feedback
        studentRating: null,
        studentReview: null,
        mentorNotes: status === 'confirmed' ? faker.helpers.arrayElement([
            'Great addition to the group dynamic',
            'Consistent attendance and effort',
            'Shows natural ability and dedication',
            'Positive influence on other students'
        ]) : '',
        
        // Metadata
        bookedAt: admin.firestore.Timestamp.fromDate(bookedAt),
        confirmedAt: status === 'confirmed' ? admin.firestore.Timestamp.fromDate(bookedAt) : null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        completedAt: null
    };
}

/**
 * Creates a 1-on-1 booking
 */
function createOneOnOneBooking(student, classData, index, youngLearner = null) {
    const publicId = generatePublicBookingId(index);
    const bookedAt = getRealisticBookingDate();
    const pricing = calculateBookingPrice(classData.pricing, student.studentProfile);
    const status = faker.helpers.weightedArrayElement([
        { weight: BOOKING_STATUS_MIX.confirmed, value: 'confirmed' },
        { weight: BOOKING_STATUS_MIX.pending, value: 'pending' },
        { weight: BOOKING_STATUS_MIX.cancelled, value: 'cancelled' }
    ]);
    
    // Generate a specific session time for 1-on-1
    const sessionDate = faker.date.future({ days: 30 });
    const availableHours = ['09:00', '10:00', '14:00', '15:00', '18:00', '19:00'];
    const startTime = faker.helpers.arrayElement(availableHours);
    const endTime = `${parseInt(startTime.split(':')[0]) + 1}:${startTime.split(':')[1]}`;
    
    return {
        bookingId: `booking_${student.publicId}_${classData.publicId}`,
        publicId: publicId,
        
        // Student Information (Denormalized)
        studentId: student.id,
        studentName: student.displayName,
        studentEmail: student.email,
        studentPhotoURL: student.photoURL,
        
        // Young Learner (if applicable)
        ...(youngLearner && {
            youngLearnerId: youngLearner.youngLearnerId,
            youngLearnerName: youngLearner.youngLearnerName
        }),
        
        // Booking Details
        bookingStatus: status,
        paymentStatus: status === 'confirmed' ? 'paid' : (status === 'pending' ? 'pending' : 'refunded'),
        paymentId: status === 'confirmed' ? `payment_${publicId.toLowerCase()}` : null,
        
        // Pricing Breakdown
        pricing: pricing,
        
        // Schedule (Specific 1-on-1 session)
        scheduledSlots: [
            {
                date: sessionDate.toISOString().split('T')[0],
                startTime: startTime,
                endTime: endTime,
                status: status === 'cancelled' ? 'cancelled' : 'confirmed'
            }
        ],
        
        // Learning Customization (More detailed for 1-on-1)
        personalGoals: faker.helpers.arrayElements([
            'Personalized learning plan', 'Individual attention and feedback',
            'Focus on specific weaknesses', 'Accelerated progress',
            'Prepare for specific goals', 'Build confidence',
            'Custom pace learning'
        ], { min: 2, max: 4 }).join(', '),
        
        specialRequests: faker.datatype.boolean({ probability: 0.6 }) ? 
            faker.helpers.arrayElement([
                'Please focus on technique fundamentals',
                'Help with specific pieces/topics',
                'Need flexibility due to work schedule',
                'Beginner-friendly approach needed',
                'Goal-oriented sessions preferred',
                'Looking for honest feedback to improve'
            ]) : '',
            
        accessibilityNeeds: [],
        
        // Communication Preferences
        allowGroupChat: false, // No group chat for 1-on-1
        preferredContactMethod: faker.helpers.arrayElement(['email', 'sms', 'app_notification']),
        
        // Attendance & Progress
        attendanceRecord: status === 'confirmed' && sessionDate < new Date() ? [
            {
                sessionDate: sessionDate.toISOString().split('T')[0],
                status: faker.helpers.arrayElement(['present', 'present', 'present', 'absent']), // 75% attendance
                notes: faker.helpers.arrayElement([
                    'Excellent focus and engagement',
                    'Clear improvement from last session',
                    'Responsive to feedback and guidance',
                    'Well-prepared and motivated'
                ])
            }
        ] : [],
        
        // Feedback
        studentRating: null,
        studentReview: null,
        mentorNotes: status === 'confirmed' ? faker.helpers.arrayElement([
            'Highly motivated student, pleasure to teach',
            'Quick learner, grasps concepts well',
            'Dedicated practice shows in sessions',
            'Great potential, recommend continued lessons'
        ]) : '',
        
        // Metadata
        bookedAt: admin.firestore.Timestamp.fromDate(bookedAt),
        confirmedAt: status === 'confirmed' ? admin.firestore.Timestamp.fromDate(bookedAt) : null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        completedAt: sessionDate < new Date() ? admin.firestore.Timestamp.fromDate(sessionDate) : null
    };
}

// ====================================================================================
// POPULATION FUNCTION
// ====================================================================================

/**
 * Populates bookings as subcollections under classes
 */
async function populateBookings() {
    console.log('🎯 Starting to populate bookings subcollections...');
    
    // Read existing data
    const [{ students, parents }, classes] = await Promise.all([
        getAllStudentsAndParents(),
        getAllApprovedClasses()
    ]);
    
    if (students.length === 0 && parents.length === 0) {
        console.error('❌ No students or parents found! Run populate-users.js first.');
        return;
    }
    
    if (classes.length === 0) {
        console.error('❌ No approved classes found! Run populate-classes.js first.');
        return;
    }
    
    // Combine all potential bookers
    const allBookers = [...students, ...parents];
    console.log(`👥 Found ${allBookers.length} potential students (${students.length} students + ${parents.length} parents)`);
    
    console.log(`\n📊 Planning ${TARGET_BOOKING_COUNT} bookings:`);
    console.log(`- Confirmed: ${Math.floor(TARGET_BOOKING_COUNT * BOOKING_STATUS_MIX.confirmed)}`);
    console.log(`- Pending: ${Math.floor(TARGET_BOOKING_COUNT * BOOKING_STATUS_MIX.pending)}`);
    console.log(`- Cancelled: ${Math.floor(TARGET_BOOKING_COUNT * BOOKING_STATUS_MIX.cancelled)}\n`);
    
    let bookingsCreated = 0;
    let globalIndex = 0;
    
    // Create bookings by randomly selecting students and classes
    for (let i = 0; i < TARGET_BOOKING_COUNT; i++) {
        const student = faker.helpers.arrayElement(allBookers);
        const selectedClass = faker.helpers.arrayElement(classes);
        
        // Determine if this is a parent booking for a young learner
        const youngLearner = student.roles.includes('parent') && faker.datatype.boolean({ probability: 0.7 }) ?
            selectYoungLearner(student) : null;
        
        let bookingData;
        
        // Create appropriate booking type based on class type
        switch (selectedClass.type) {
            case 'workshop':
                bookingData = createWorkshopBooking(student, selectedClass, globalIndex, youngLearner);
                break;
            case 'batch':
                bookingData = createBatchEnrollment(student, selectedClass, globalIndex, youngLearner);
                break;
            case 'one-on-one':
                bookingData = createOneOnOneBooking(student, selectedClass, globalIndex, youngLearner);
                break;
            default:
                console.warn(`⚠️ Unknown class type: ${selectedClass.type}`);
                continue;
        }
        
        // Write to Firestore as subcollection
        try {
            const bookingRef = db.collection('classes')
                .doc(selectedClass.id)
                .collection('bookings')
                .doc(); // Auto-generate booking document ID
            
            await bookingRef.set(bookingData);
            
            bookingsCreated++;
            globalIndex++;
            
            if (bookingsCreated % 10 === 0) {
                console.log(`✅ Progress: Created ${bookingsCreated}/${TARGET_BOOKING_COUNT} bookings`);
            }
            
            // Small delay to avoid rate limiting
            if (bookingsCreated % 20 === 0) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
        } catch (error) {
            console.error(`❌ Error creating booking for class ${selectedClass.publicId}:`, error.message);
        }
    }
    
    console.log(`\n🎉 Population complete! Successfully created ${bookingsCreated} bookings.`);
    
    // Print summary statistics
    console.log('\n📊 Summary:');
    console.log('- Bookings created as subcollections under /classes/{classId}/bookings/');
    console.log('- Mix of workshop signups, batch enrollments, and 1-on-1 bookings');
    console.log('- Realistic booking statuses and payment states');
    console.log('- Some parent bookings for young learners');
    console.log('- Applied discounts and realistic pricing');
    console.log('- Attendance records for completed sessions');
    console.log('- Public IDs: RW-B-2025-001, RW-B-2025-002, etc.');
    
    console.log('\n🎓 Booking Distribution:');
    console.log(`  📋 Workshop Bookings: ~${Math.floor(bookingsCreated * 0.4)}`);
    console.log(`  🎓 Batch Enrollments: ~${Math.floor(bookingsCreated * 0.4)}`);
    console.log(`  👤 1-on-1 Bookings: ~${Math.floor(bookingsCreated * 0.2)}`);
    
    console.log('\n🔍 To view bookings in Firebase Console:');
    console.log('   Go to classes → Select any class → View "bookings" subcollection');
}

// ====================================================================================
// SCRIPT EXECUTION
// ====================================================================================

// Run the population script
populateBookings()
    .then(() => {
        console.log('\n🚀 Bookings population completed successfully!');
        process.exit(0);
    })
    .catch(error => {
        console.error("💥 An unexpected error occurred:", error);
        process.exit(1);
    });