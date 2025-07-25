// populate.js

// Import the Firebase Admin SDK
const admin = require('firebase-admin');
// Import Faker for generating mock data
const { faker } = require('@faker-js/faker');

// Import your service account key
const serviceAccount = require('./serviceAccountKey.json');

// ====================================================================================
// CONFIGURATION
// ====================================================================================
const BATCH_SIZE = 50; // Firestore allows a maximum of 500 operations per batch
const MENTOR_COUNT = 50; // The total number of mentors you want to create

// ====================================================================================
// INITIALIZE FIREBASE ADMIN SDK
// ====================================================================================
try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin SDK initialized successfully.');
} catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    process.exit(1); // Exit if initialization fails
}

const db = admin.firestore();

// ====================================================================================
// DATA FACTORY FUNCTION
// ====================================================================================

/**
 * Generates a mock mentor object.
 * @returns {object} A user object configured as a mentor.
 */
function createMockMentor() {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    return {
        displayName: `${firstName} ${lastName}`,
        email: faker.internet.email({ firstName, lastName }),
        photoURL: faker.image.avatar(),
        phoneNumber: faker.phone.number(),
        authProvider: faker.helpers.arrayElement(['email', 'google']),
        // All users created by this script are both users and mentors
        roles: ['mentee', 'mentor'], 
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        bio: faker.lorem.paragraph(3),
        location: {
            city: faker.location.city(),
            postcode: faker.location.zipCode(),
            country: faker.location.country(),
        },
        // Skills the mentor teaches - now with a wider variety
        skills: faker.helpers.arrayElements([
            'JavaScript', 'React', 'Node.js', 'Python', 'Data Science', 
            'UI/UX Design', 'Project Management', 'Public Speaking', 'Creative Writing',
            'Digital Marketing', 'SEO Strategy', 'Guitar', 'Piano', 'Singing',
            'Dancing', 'Photography', 'Videography', 'Graphic Design', 'Yoga Instruction'
        ], { min: 2, max: 4 }),
        // General interests for matching
        interests: faker.helpers.arrayElements(['Technology', 'Startups', 'Photography', 'Hiking', 'Cooking', 'Gaming', 'Reading', 'Music', 'Art'], { min: 2, max: 3 }),
        mentorProfile: {
            status: 'approved', // We'll assume all seeded mentors are approved
            headline: faker.lorem.sentence(),
            rate: faker.number.int({ min: 25, max: 150 }),
            totalReviews: faker.number.int({ min: 5, max: 250 }),
            averageRating: parseFloat(faker.number.float({ min: 4.0, max: 5.0, precision: 0.1 }).toFixed(1)),
        }
    };
}


// ====================================================================================
// SCRIPT EXECUTION LOGIC
// ====================================================================================

/**
 * Populates the 'users' collection with a specified number of mentors.
 * Uses Firestore batched writes for efficiency.
 */
async function populateMentors() {
    console.log(`Starting to populate ${MENTOR_COUNT} mentors...`);
    const usersCollection = db.collection('users');
    let mentorsCreated = 0;

    // Process in batches
    for (let i = 0; i < MENTOR_COUNT; i += BATCH_SIZE) {
        const batch = db.batch();
        const batchLimit = Math.min(i + BATCH_SIZE, MENTOR_COUNT);
        
        console.log(`Creating batch: from mentor ${i + 1} to ${batchLimit}`);

        for (let j = i; j < batchLimit; j++) {
            const mentorData = createMockMentor();
            // Let Firestore auto-generate the document ID
            const docRef = usersCollection.doc(); 
            batch.set(docRef, mentorData);
        }

        try {
            await batch.commit();
            mentorsCreated += (batchLimit - i);
            console.log(`Successfully committed batch. Total mentors created: ${mentorsCreated}/${MENTOR_COUNT}`);
        } catch (error) {
            console.error('Error committing batch:', error);
            // Decide if you want to stop on error or continue
        }
    }

    console.log(`\n--- Population complete. Successfully created ${mentorsCreated} mentors. ---`);
}

// Run the population script
populateMentors().catch(error => {
    console.error("An unexpected error occurred:", error);
});
