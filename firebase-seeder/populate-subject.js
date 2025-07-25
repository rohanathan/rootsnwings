// populate-subjects.js - Roots & Wings Subject Categories Seeder

// Import the Firebase Admin SDK
const admin = require('firebase-admin');
// Import Faker for generating mock data (for stats)
const { faker } = require('@faker-js/faker');

// Import your service account key
const serviceAccount = require('./serviceAccountKey.json');

// ====================================================================================
// CONFIGURATION
// ====================================================================================
const BATCH_SIZE = 25; // All subjects in one batch

// ====================================================================================
// INITIALIZE FIREBASE ADMIN SDK (Check if already initialized)
// ====================================================================================
let db;
try {
    // Check if Firebase is already initialized
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
// SUBJECT DATA STRUCTURE
// ====================================================================================

const SUBJECT_CATEGORIES = [
    {
        id: 'music',
        name: 'Music',
        description: 'Musical instruments, theory, and vocal training',
        subcategories: [
            {
                id: 'piano',
                name: 'Piano & Keyboard',
                commonSpecializations: ['Classical Piano', 'Jazz Piano', 'Contemporary', 'Music Theory', 'Composition']
            },
            {
                id: 'guitar',
                name: 'Guitar',
                commonSpecializations: ['Acoustic Guitar', 'Electric Guitar', 'Classical Guitar', 'Bass Guitar', 'Fingerpicking']
            },
            {
                id: 'singing',
                name: 'Singing & Vocals',
                commonSpecializations: ['Classical Vocals', 'Pop Singing', 'Opera', 'Choir', 'Vocal Technique']
            },
            {
                id: 'violin',
                name: 'Violin & Strings',
                commonSpecializations: ['Classical Violin', 'Fiddle', 'Viola', 'Cello', 'String Ensemble']
            },
            {
                id: 'drums',
                name: 'Drums & Percussion',
                commonSpecializations: ['Drum Kit', 'Classical Percussion', 'World Percussion', 'Electronic Drums']
            }
        ]
    },
    {
        id: 'arts',
        name: 'Arts & Design',
        description: 'Visual arts, design, and creative expression',
        subcategories: [
            {
                id: 'painting',
                name: 'Painting',
                commonSpecializations: ['Oil Painting', 'Watercolor', 'Acrylic', 'Abstract Art', 'Portrait Painting']
            },
            {
                id: 'drawing',
                name: 'Drawing & Illustration',
                commonSpecializations: ['Life Drawing', 'Digital Art', 'Sketching', 'Comic Art', 'Technical Drawing']
            },
            {
                id: 'photography',
                name: 'Photography',
                commonSpecializations: ['Portrait Photography', 'Wedding Photography', 'Nature Photography', 'Commercial Photography']
            },
            {
                id: 'crafts',
                name: 'Crafts & Pottery',
                commonSpecializations: ['Ceramics', 'Pottery', 'Jewelry Making', 'Woodworking', 'Textile Arts']
            }
        ]
    },
    {
        id: 'languages',
        name: 'Languages',
        description: 'Language learning and communication skills',
        subcategories: [
            {
                id: 'english',
                name: 'English',
                commonSpecializations: ['Business English', 'Academic English', 'Conversational English', 'IELTS Prep', 'Creative Writing']
            },
            {
                id: 'spanish',
                name: 'Spanish',
                commonSpecializations: ['Conversational Spanish', 'Business Spanish', 'Spanish Literature', 'DELE Prep']
            },
            {
                id: 'french',
                name: 'French',
                commonSpecializations: ['Conversational French', 'Business French', 'French Literature', 'DELF Prep']
            },
            {
                id: 'mandarin',
                name: 'Mandarin Chinese',
                commonSpecializations: ['Conversational Mandarin', 'Business Chinese', 'HSK Prep', 'Chinese Calligraphy']
            }
        ]
    },
    {
        id: 'academics',
        name: 'Academic Subjects',
        description: 'Traditional school subjects and exam preparation',
        subcategories: [
            {
                id: 'mathematics',
                name: 'Mathematics',
                commonSpecializations: ['GCSE Maths', 'A-Level Maths', 'University Maths', 'Statistics', 'Calculus']
            },
            {
                id: 'science',
                name: 'Science',
                commonSpecializations: ['Physics', 'Chemistry', 'Biology', 'GCSE Science', 'A-Level Science']
            },
            {
                id: 'history',
                name: 'History',
                commonSpecializations: ['British History', 'World History', 'GCSE History', 'A-Level History']
            },
            {
                id: 'english-literature',
                name: 'English Literature',
                commonSpecializations: ['GCSE English Lit', 'A-Level English Lit', 'Creative Writing', 'Poetry']
            }
        ]
    },
    {
        id: 'wellness',
        name: 'Health & Wellness',
        description: 'Physical and mental wellbeing practices',
        subcategories: [
            {
                id: 'yoga',
                name: 'Yoga',
                commonSpecializations: ['Hatha Yoga', 'Vinyasa Yoga', 'Yin Yoga', 'Meditation', 'Pranayama']
            },
            {
                id: 'fitness',
                name: 'Fitness Training',
                commonSpecializations: ['Personal Training', 'Weight Training', 'Cardio', 'Flexibility', 'Sports Coaching']
            },
            {
                id: 'meditation',
                name: 'Meditation & Mindfulness',
                commonSpecializations: ['Mindfulness Meditation', 'Guided Meditation', 'Breathing Techniques', 'Stress Management']
            }
        ]
    },
    {
        id: 'technology',
        name: 'Technology',
        description: 'Programming, digital skills, and tech education',
        subcategories: [
            {
                id: 'programming',
                name: 'Programming',
                commonSpecializations: ['JavaScript', 'Python', 'React', 'Web Development', 'Mobile Apps']
            },
            {
                id: 'digital-design',
                name: 'Digital Design',
                commonSpecializations: ['UI/UX Design', 'Graphic Design', 'Adobe Photoshop', 'Web Design']
            },
            {
                id: 'data-science',
                name: 'Data Science',
                commonSpecializations: ['Data Analysis', 'Machine Learning', 'Statistics', 'Excel', 'SQL']
            }
        ]
    },
    {
        id: 'business',
        name: 'Business & Finance',
        description: 'Business skills, entrepreneurship, and financial literacy',
        subcategories: [
            {
                id: 'business-skills',
                name: 'Business Skills',
                commonSpecializations: ['Public Speaking', 'Leadership', 'Project Management', 'Marketing', 'Sales']
            },
            {
                id: 'finance',
                name: 'Finance',
                commonSpecializations: ['Personal Finance', 'Investment', 'Accounting', 'Financial Planning']
            }
        ]
    },
    {
        id: 'heritage',
        name: 'Cultural Heritage',
        description: 'Traditional arts, philosophy, and cultural practices',
        subcategories: [
            {
                id: 'philosophy',
                name: 'Philosophy',
                commonSpecializations: ['Ancient Philosophy', 'Ethics', 'Logic', 'Eastern Philosophy', 'Western Philosophy']
            },
            {
                id: 'traditional-arts',
                name: 'Traditional Arts',
                commonSpecializations: ['Calligraphy', 'Traditional Dance', 'Folk Music', 'Cultural Studies']
            },
            {
                id: 'religious-studies',
                name: 'Religious Studies',
                commonSpecializations: ['Comparative Religion', 'Theology', 'Meditation Practices', 'Sacred Texts']
            }
        ]
    }
];

// ====================================================================================
// HELPER FUNCTIONS
// ====================================================================================

/**
 * Generates a subject-friendly public ID
 * Format: RW-S-2025-001 (Roots & Wings - Subject - Year - Sequential)
 */
function generatePublicSubjectId(index) {
    const year = new Date().getFullYear();
    const paddedIndex = String(index + 1).padStart(3, '0');
    return `RW-S-${year}-${paddedIndex}`;
}

/**
 * Generates realistic stats for a subject
 */
function generateSubjectStats() {
    return {
        totalMentors: faker.number.int({ min: 1, max: 15 }),
        activeMentors: faker.number.int({ min: 1, max: 12 }),
        totalStudents: faker.number.int({ min: 5, max: 100 }),
        totalSessions: faker.number.int({ min: 10, max: 500 }),
        averageRating: faker.number.float({ min: 4.2, max: 5.0, precision: 0.1 }),
        popularityScore: faker.number.int({ min: 30, max: 95 })
    };
}

/**
 * Creates a subject document from category and subcategory data
 */
function createSubjectDocument(category, subcategory, index) {
    const publicId = generatePublicSubjectId(index);
    const stats = generateSubjectStats();
    
    return {
        // Identifiers
        publicId: publicId,
        subjectId: subcategory.id,
        
        // Basic Information
        name: subcategory.name,
        displayName: subcategory.name,
        slug: subcategory.id,
        description: `Learn ${subcategory.name.toLowerCase()} with experienced mentors. ${category.description}`,
        
        // Hierarchy
        category: category.id,
        categoryName: category.name,
        parentCategory: category.id,
        
        // Visual Identity
        iconURL: `https://cdn.rootsandwings.co.uk/icons/${subcategory.id}.svg`,
        bannerURL: `https://cdn.rootsandwings.co.uk/banners/${subcategory.id}-hero.jpg`,
        colorScheme: faker.internet.color(),
        
        // Educational Structure
        subcategories: [], // Future expansion
        commonSpecializations: subcategory.commonSpecializations,
        
        // Learning Framework
        skillLevels: [
            {
                level: 'beginner',
                description: 'No prior experience required',
                typicalDuration: '3-6 months',
                keySkills: subcategory.commonSpecializations.slice(0, 2)
            },
            {
                level: 'intermediate',
                description: 'Some experience with basics',
                typicalDuration: '6-12 months', 
                keySkills: subcategory.commonSpecializations.slice(1, 4)
            },
            {
                level: 'advanced',
                description: 'Proficient and seeking mastery',
                typicalDuration: '1+ years',
                keySkills: subcategory.commonSpecializations.slice(2)
            }
        ],
        
        // Age Group Suitability
        ageGroups: [
            {
                group: 'child',
                minAge: 6,
                maxAge: 12,
                specialConsiderations: ['Shorter sessions', 'Visual learning', 'Fun activities']
            },
            {
                group: 'teen',
                minAge: 13,
                maxAge: 17,
                specialConsiderations: ['Peer interaction', 'Goal-oriented', 'Creative expression']
            },
            {
                group: 'adult',
                minAge: 18,
                maxAge: null,
                specialConsiderations: ['Flexible scheduling', 'Personal goals', 'Professional development']
            }
        ],
        
        // Market Information
        pricing: {
            averageHourlyRate: faker.number.float({ min: 20, max: 50, precision: 0.50 }),
            priceRange: {
                min: faker.number.float({ min: 15, max: 25, precision: 0.50 }),
                max: faker.number.float({ min: 40, max: 70, precision: 0.50 })
            },
            currency: 'GBP'
        },
        
        // Statistics
        stats: stats,
        
        // SEO & Discovery
        keywords: [
            subcategory.name.toLowerCase(),
            ...subcategory.commonSpecializations.map(s => s.toLowerCase()),
            category.name.toLowerCase(),
            'lessons', 'classes', 'tutor', 'mentor'
        ],
        relatedSubjects: [], // Will be populated later
        
        // Requirements & Equipment (varies by subject)
        requirements: {
            equipment: generateEquipmentList(subcategory.id),
            software: [],
            space: ['Quiet learning environment', 'Good internet connection (for online sessions)']
        },
        
        // Learning Outcomes
        commonGoals: generateCommonGoals(subcategory.name),
        
        // Subject Status
        isActive: true,
        featured: faker.datatype.boolean({ probability: 0.3 }),
        trending: faker.datatype.boolean({ probability: 0.2 }),
        
        // Metadata
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastAnalyticsUpdate: admin.firestore.FieldValue.serverTimestamp()
    };
}

/**
 * Generates equipment list based on subject type
 */
function generateEquipmentList(subjectId) {
    const equipmentMap = {
        'piano': ['Piano or 88-key keyboard', 'Adjustable bench', 'Music stand'],
        'guitar': ['Acoustic or electric guitar', 'Guitar picks', 'Tuner', 'Music stand'],
        'singing': ['Good microphone (for recording)', 'Piano access (optional)', 'Comfortable clothing'],
        'painting': ['Canvas or paper', 'Paint brushes', 'Acrylic or oil paints', 'Palette'],
        'photography': ['Camera (DSLR or mirrorless)', 'Tripod', 'Memory cards', 'Computer for editing'],
        'yoga': ['Yoga mat', 'Comfortable clothing', 'Quiet space', 'Yoga blocks (optional)'],
        'programming': ['Computer', 'Text editor/IDE', 'Stable internet connection'],
        'mathematics': ['Calculator', 'Notebooks', 'Pencils and erasers', 'Textbooks'],
        'default': ['Basic learning materials', 'Notebook and pen', 'Quiet study space']
    };
    
    return equipmentMap[subjectId] || equipmentMap['default'];
}

/**
 * Generates common learning goals for a subject
 */
function generateCommonGoals(subjectName) {
    const baseGoals = [
        `Master ${subjectName.toLowerCase()} fundamentals`,
        `Build confidence in ${subjectName.toLowerCase()}`,
        `Develop personal style`,
        'Prepare for performances/exams',
        'Connect with others who share the interest'
    ];
    
    return faker.helpers.arrayElements(baseGoals, { min: 3, max: 5 });
}

// ====================================================================================
// POPULATION FUNCTION
// ====================================================================================

/**
 * Populates the 'subjects' collection with hierarchical subject data
 */
async function populateSubjects() {
    console.log('🎯 Starting to populate subjects collection...');
    const subjectsCollection = db.collection('subjects');
    
    let subjectsCreated = 0;
    let globalIndex = 0;
    
    // Create documents for each subcategory (these become our main subjects)
    const batch = db.batch();
    
    for (const category of SUBJECT_CATEGORIES) {
        console.log(`📚 Processing category: ${category.name}`);
        
        for (const subcategory of category.subcategories) {
            const subjectDoc = createSubjectDocument(category, subcategory, globalIndex);
            const docRef = subjectsCollection.doc(subcategory.id); // Use subcategory ID as document ID
            batch.set(docRef, subjectDoc);
            
            globalIndex++;
            console.log(`  ✅ Created subject: ${subcategory.name} (${subjectDoc.publicId})`);
        }
    }
    
    try {
        await batch.commit();
        subjectsCreated = globalIndex;
        console.log(`\n🎉 Population complete! Successfully created ${subjectsCreated} subjects.`);
        
        // Print summary
        console.log('\n📊 Summary:');
        console.log(`- Created ${SUBJECT_CATEGORIES.length} main categories`);
        console.log(`- Created ${subjectsCreated} individual subjects`);
        console.log('- Each subject has realistic stats and specializations');
        console.log('- Public IDs: RW-S-2025-001, RW-S-2025-002, etc.');
        console.log('- Document IDs match subject slugs (piano, guitar, etc.)');
        console.log('- Ready for mentor selection and class creation!');
        
        // Print categories overview
        console.log('\n🗂️ Categories created:');
        SUBJECT_CATEGORIES.forEach(cat => {
            console.log(`  ${cat.name}: ${cat.subcategories.map(sub => sub.name).join(', ')}`);
        });
        
    } catch (error) {
        console.error('❌ Error creating subjects:', error);
    }
}

// ====================================================================================
// SCRIPT EXECUTION
// ====================================================================================

// Run the population script
populateSubjects()
    .then(() => {
        console.log('\n🚀 Subjects population completed successfully!');
        process.exit(0);
    })
    .catch(error => {
        console.error("💥 An unexpected error occurred:", error);
        process.exit(1);
    });