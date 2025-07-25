// populate-users.js - Roots & Wings Users Collection Seeder

// Import the Firebase Admin SDK
const admin = require('firebase-admin');
// Import Faker for generating mock data
const { faker } = require('@faker-js/faker');

// Import your service account key
const serviceAccount = require('./serviceAccountKey.json');

// ====================================================================================
// CONFIGURATION
// ====================================================================================
const BATCH_SIZE = 10; // Start small for testing
const USER_COUNT = 20; // Start with 20 users for testing

// ====================================================================================
// INITIALIZE FIREBASE ADMIN SDK
// ====================================================================================
try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('🚀 Firebase Admin SDK initialized successfully.');
} catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error);
    process.exit(1);
}

const db = admin.firestore();

// ====================================================================================
// UK-SPECIFIC DATA ARRAYS
// ====================================================================================
const UK_CITIES = [
    'Birmingham', 'Manchester', 'Liverpool', 'Leeds', 'Sheffield',
    'Bristol', 'Glasgow', 'Edinburgh', 'Cardiff', 'Belfast',
    'Newcastle', 'Nottingham', 'Leicester', 'Coventry', 'Bradford'
];

const UK_POSTCODES = [
    'B15 2TT', 'M1 1AA', 'L1 8JQ', 'LS1 1BA', 'S1 2HE',
    'BS1 3NX', 'G1 2FF', 'EH1 1YZ', 'CF10 3AT', 'BT1 5GS'
];

const SUBJECTS = [
    'piano', 'guitar', 'violin', 'singing', 'music-theory',
    'painting', 'drawing', 'photography', 'creative-writing',
    'mathematics', 'english', 'science', 'history',
    'spanish', 'french', 'german', 'mandarin',
    'yoga', 'meditation', 'cooking', 'gardening',
    'coding', 'web-design', 'digital-marketing'
];

const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced'];
const AGE_GROUPS = ['child', 'teen', 'adult'];

// ====================================================================================
// HELPER FUNCTIONS
// ====================================================================================

/**
 * Generates a user-friendly public ID
 * Format: RW-U-2025-001 (Roots & Wings - User - Year - Sequential)
 */
function generatePublicUserId(index) {
    const year = new Date().getFullYear();
    const paddedIndex = String(index + 1).padStart(3, '0');
    return `RW-U-${year}-${paddedIndex}`;
}

// ====================================================================================
// DATA FACTORY FUNCTIONS
// ====================================================================================

/**
 * Generates roles for a user (can be multiple)
 */
function generateUserRoles() {
    const roleOptions = ['student', 'mentor', 'parent'];
    // 60% chance single role, 40% chance multiple roles
    if (faker.datatype.boolean({ probability: 0.6 })) {
        return [faker.helpers.arrayElement(roleOptions)];
    } else {
        return faker.helpers.arrayElements(roleOptions, { min: 2, max: 2 });
    }
}

/**
 * Generates student profile if user has 'student' role
 */
function generateStudentProfile() {
    const subjects = faker.helpers.arrayElements(SUBJECTS, { min: 1, max: 3 });
    const skillLevels = {};
    
    subjects.forEach(subject => {
        skillLevels[subject] = faker.helpers.arrayElement(SKILL_LEVELS);
    });

    return {
        interests: subjects,
        skillLevels: skillLevels,
        learningGoals: faker.helpers.arrayElements([
            'Build confidence', 'Learn fundamentals', 'Prepare for exams',
            'Personal enrichment', 'Career development', 'Creative expression'
        ], { min: 1, max: 2 }).join(', '),
        completedSessions: faker.number.int({ min: 0, max: 25 }),
        totalSpent: faker.number.float({ min: 0, max: 500, precision: 0.01 }),
        preferredFormat: faker.helpers.arrayElement(['online', 'in-person', 'both']),
        ageGroup: faker.helpers.arrayElement(AGE_GROUPS)
    };
}

/**
 * Generates mentor profile if user has 'mentor' role
 */
function generateMentorProfile() {
    const subjects = faker.helpers.arrayElements(SUBJECTS, { min: 2, max: 4 });
    
    return {
        // Status & Verification
        status: faker.helpers.arrayElement(['approved', 'pending', 'suspended']),
        isVerified: faker.datatype.boolean({ probability: 0.8 }),
        backgroundChecked: faker.datatype.boolean({ probability: 0.7 }),
        acceptingNewStudents: faker.datatype.boolean({ probability: 0.85 }),
        
        // Public Profile
        headline: faker.helpers.arrayElements([
            'Experienced Piano Teacher', 'Creative Writing Mentor', 
            'Mathematics Tutor', 'Language Learning Specialist',
            'Art & Design Coach', 'Music Theory Expert'
        ]),
        subjects: subjects,
        bio: faker.lorem.paragraphs(2, '\n\n').substring(0, 450) + '...',
        
        // Teaching Preferences
        teachingLevels: faker.helpers.arrayElements(SKILL_LEVELS, { min: 1, max: 3 }),
        ageGroups: faker.helpers.arrayElements(AGE_GROUPS, { min: 1, max: 3 }),
        languages: faker.helpers.arrayElements(['English', 'Spanish', 'French', 'German', 'Mandarin'], { min: 1, max: 2 }),
        
        // Pricing
        pricing: {
            oneOnOneRate: faker.number.float({ min: 20, max: 60, precision: 0.50 }),
            groupRate: faker.number.float({ min: 10, max: 25, precision: 0.50 }),
            currency: 'GBP',
            firstSessionFree: faker.datatype.boolean({ probability: 0.6 })
        },
        
        // Stats (realistic for new platform)
        stats: {
            avgRating: faker.number.float({ min: 4.2, max: 5.0, precision: 0.1 }),
            totalReviews: faker.number.int({ min: 0, max: 50 }),
            totalStudents: faker.number.int({ min: 0, max: 80 }),
            totalSessions: faker.number.int({ min: 0, max: 200 }),
            responseTimeMinutes: faker.number.int({ min: 5, max: 120 }),
            repeatStudentRate: faker.number.int({ min: 60, max: 95 })
        },
        
        // Availability Summary
        availability: {
            timezone: 'Europe/London',
            generallyAvailable: faker.helpers.arrayElements(
                ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], 
                { min: 3, max: 6 }
            ),
            preferredHours: faker.helpers.arrayElement(['09:00-17:00', '10:00-18:00', '14:00-22:00', '18:00-21:00'])
        }
    };
}

/**
 * Generates parent profile if user has 'parent' role
 */
function generateParentProfile() {
    return {
        youngLearnerCount: faker.number.int({ min: 1, max: 3 }),
        primaryContact: faker.datatype.boolean({ probability: 0.9 }),
        emergencyContact: faker.phone.number('07### ######'),
        paymentMethod: `card_ending_${faker.number.int({ min: 1000, max: 9999 })}`
    };
}

/**
 * Generates a complete user with role-based profiles
 */
function createMockUser(userIndex) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const roles = generateUserRoles();
    
    // Generate public user ID (user-friendly identifier)
    const publicId = generatePublicUserId(userIndex);
    
    // Base user object
    const user = {
        // Public identifier (for URLs, sharing, etc.)
        publicId: publicId,
        
        // Authentication & Identity  
        uid: faker.string.uuid(), // Keep for backward compatibility (can remove later)
        email: faker.internet.email({ firstName, lastName }),
        displayName: `${firstName} ${lastName}`,
        photoURL: faker.image.avatar(),
        phoneNumber: faker.phone.number('07### ######'),
        
        // Multi-Role System
        roles: roles,
        
        // Location (UK-focused)
        location: {
            city: faker.helpers.arrayElement(UK_CITIES),
            region: faker.helpers.arrayElement(['England', 'Scotland', 'Wales', 'Northern Ireland']),
            country: 'UK',
            postcode: faker.helpers.arrayElement(UK_POSTCODES),
            coordinates: {
                lat: faker.location.latitude({ min: 50.5, max: 58.6 }),
                lng: faker.location.longitude({ min: -7.5, max: 1.8 })
            }
        },
        
        // Account Settings
        preferences: {
            notifications: {
                email: faker.datatype.boolean({ probability: 0.8 }),
                sms: faker.datatype.boolean({ probability: 0.4 }),
                push: faker.datatype.boolean({ probability: 0.9 }),
                marketingEmails: faker.datatype.boolean({ probability: 0.3 })
            },
            privacy: {
                showEmail: faker.datatype.boolean({ probability: 0.2 }),
                showPhone: faker.datatype.boolean({ probability: 0.1 }),
                showLocation: faker.helpers.arrayElement(['full', 'city_only', 'hidden'])
            },
            language: 'en-GB',
            currency: 'GBP'
        },
        
        // Account Metadata
        accountStatus: faker.helpers.arrayElement(['active', 'pending', 'suspended']),
        verificationLevel: faker.helpers.arrayElement(['email_verified', 'phone_verified', 'document_verified']),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: faker.date.recent({ days: 30 }),
        lastActiveAt: faker.date.recent({ days: 7 })
    };
    
    // Add role-specific profiles
    if (roles.includes('student')) {
        user.studentProfile = generateStudentProfile();
    }
    
    if (roles.includes('mentor')) {
        user.mentorProfile = generateMentorProfile();
    }
    
    if (roles.includes('parent')) {
        user.parentProfile = generateParentProfile();
    }
    
    return user;
}

// ====================================================================================
// POPULATION FUNCTION
// ====================================================================================

/**
 * Populates the 'users' collection with our new schema
 */
async function populateUsers() {
    console.log(`🎯 Starting to populate ${USER_COUNT} users with new schema...`);
    const usersCollection = db.collection('users');
    let usersCreated = 0;
    let globalUserIndex = 0; // For sequential public ID generation

    // Process in batches
    for (let i = 0; i < USER_COUNT; i += BATCH_SIZE) {
        const batch = db.batch();
        const batchLimit = Math.min(i + BATCH_SIZE, USER_COUNT);
        
        console.log(`📦 Creating batch: users ${i + 1} to ${batchLimit}`);

        for (let j = i; j < batchLimit; j++) {
            const userData = createMockUser(globalUserIndex);
            // Use auto-generated document ID (Firebase best practice)
            const docRef = usersCollection.doc();
            batch.set(docRef, userData);
            globalUserIndex++;
        }

        try {
            await batch.commit();
            usersCreated += (batchLimit - i);
            console.log(`✅ Successfully committed batch. Total users created: ${usersCreated}/${USER_COUNT}`);
            
            // Add a small delay between batches to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            console.error('❌ Error committing batch:', error);
        }
    }

    console.log(`\n🎉 Population complete! Successfully created ${usersCreated} users.`);
    
    // Print summary statistics
    console.log('\n📊 Summary:');
    console.log('- Users have public IDs: RW-U-2025-001, RW-U-2025-002, etc.');
    console.log('- Document IDs are auto-generated by Firebase (internal use)');
    console.log('- Users with multiple roles have multiple profile objects');
    console.log('- All users have UK-based locations');
    console.log('- Mentors have realistic pricing and stats');
    console.log('- Check Firebase Console to see the new data structure!\n');
}

// ====================================================================================
// SCRIPT EXECUTION
// ====================================================================================

// Run the population script
populateUsers()
    .then(() => {
        console.log('🚀 Script completed successfully!');
        process.exit(0);
    })
    .catch(error => {
        console.error("💥 An unexpected error occurred:", error);
        process.exit(1);
    });