// populate-conversations.js - Roots & Wings Conversations & Messages Seeder

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
const MESSAGES_PER_CONVERSATION = { min: 3, max: 12 }; // Random message count per conversation

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
// MESSAGE TEMPLATES
// ====================================================================================

const MESSAGE_TEMPLATES = {
    // Initial booking messages
    booking_confirmation: [
        "Hi! I'm excited to confirm your booking for {className}. Looking forward to working with you!",
        "Thanks for booking {className}! I'll send you some preparation materials before we start.",
        "Great to have you in {className}! Feel free to ask any questions before we begin.",
        "Welcome to {className}! I'm looking forward to helping you achieve your learning goals."
    ],
    
    student_responses: [
        "Thank you! I'm really excited to get started.",
        "Looking forward to it! Any materials I should prepare in advance?",
        "Thanks for the warm welcome. This is my first time trying {subject}.",
        "Excited to learn! What should I expect in our first session?",
        "Thank you! I've been wanting to learn {subject} for a while now."
    ],
    
    // Learning progress messages
    progress_updates: [
        "Great progress in today's session! Keep practicing what we covered.",
        "You're doing really well! I can see improvement from last week.",
        "Excellent work today. Here are some practice exercises for this week.",
        "Really impressed with your dedication. You're picking this up quickly!",
        "Today's session went well. Remember to focus on the fundamentals we discussed."
    ],
    
    student_progress_responses: [
        "Thank you for the encouragement! I'll keep practicing.",
        "Really enjoying the lessons. The practice exercises are helpful.",
        "Thanks for your patience. I feel like I'm making progress!",
        "Looking forward to next session. I've been practicing daily.",
        "Thank you for the feedback. It's really motivating!"
    ],
    
    // Scheduling messages
    scheduling: [
        "Just wanted to confirm our session tomorrow at {time}. See you then!",
        "Quick reminder about our {day} session. Let me know if you need to reschedule.",
        "Looking forward to our session this week. Any specific topics you'd like to focus on?",
        "Hi! Can we reschedule next week's session? I have a conflict.",
        "Reminder: Our session is coming up. Make sure you have your materials ready!"
    ],
    
    // Group chat messages (for batch classes)
    group_introductions: [
        "Welcome everyone to our {className} group! Looking forward to learning together.",
        "Hi all! Excited to be part of this group. Can't wait to get started!",
        "Hello everyone! This is my first group class, looking forward to meeting you all.",
        "Great to see such enthusiasm in the group! Let's have a wonderful learning journey.",
        "Hi team! Ready to dive into {subject} together. This is going to be fun!"
    ],
    
    group_discussions: [
        "That was a great session today! The group dynamic really helps with learning.",
        "Thanks everyone for the collaborative spirit. I learned a lot from you all.",
        "Quick question - did anyone else find the {topic} section challenging?",
        "Love the energy in our group! See you all next session.",
        "Sharing some extra practice resources that might help everyone."
    ],
    
    // System messages
    system_messages: [
        {
            type: "session_confirmed",
            content: "Session confirmed for {date} at {time}",
            data: { sessionType: "reminder" }
        },
        {
            type: "class_started",
            content: "Class has begun. Welcome to {className}!",
            data: { classEvent: "start" }
        },
        {
            type: "payment_confirmed",
            content: "Payment received. Your booking is now confirmed.",
            data: { paymentStatus: "completed" }
        }
    ]
};

// ====================================================================================
// HELPER FUNCTIONS
// ====================================================================================

/**
 * Generates a conversation-friendly public ID
 * Format: RW-CONV-2025-001 (Roots & Wings - Conversation - Year - Sequential)
 */
function generatePublicConversationId(index) {
    const year = new Date().getFullYear();
    const paddedIndex = String(index + 1).padStart(3, '0');
    return `RW-CONV-${year}-${paddedIndex}`;
}

/**
 * Generates a message-friendly public ID
 * Format: RW-MSG-2025-001 (Roots & Wings - Message - Year - Sequential)
 */
function generatePublicMessageId(index) {
    const year = new Date().getFullYear();
    const paddedIndex = String(index + 1).padStart(3, '0');
    return `RW-MSG-${year}-${paddedIndex}`;
}

/**
 * Gets a realistic conversation start date (1-20 days ago)
 */
function getConversationStartDate() {
    const daysAgo = faker.number.int({ min: 1, max: 20 });
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
}

/**
 * Generates chronological messages with realistic timing
 */
function generateMessageSequence(participants, conversationContext) {
    const messageCount = faker.number.int(MESSAGES_PER_CONVERSATION);
    const messages = [];
    let messageIndex = 0;
    
    const startDate = getConversationStartDate();
    let currentDate = new Date(startDate);
    
    // First message is usually from mentor (booking confirmation)
    const firstMessage = createMessage(
        participants.find(p => p.role === 'mentor'),
        MESSAGE_TEMPLATES.booking_confirmation,
        conversationContext,
        messageIndex++,
        currentDate
    );
    messages.push(firstMessage);
    
    // Advance time by 1-6 hours for response
    currentDate = new Date(currentDate.getTime() + faker.number.int({ min: 1, max: 6 }) * 60 * 60 * 1000);
    
    // Generate alternating conversation
    for (let i = 1; i < messageCount; i++) {
        // Determine sender (alternate between participants with some randomness)
        const lastSenderId = messages[messages.length - 1].senderId;
        const otherParticipants = participants.filter(p => p.userId !== lastSenderId);
        const sender = otherParticipants.length > 0 ? 
            faker.helpers.arrayElement(otherParticipants) : 
            faker.helpers.arrayElement(participants);
        
        // Choose message type based on context and position in conversation
        let messageTemplates;
        if (sender.role === 'mentor') {
            messageTemplates = faker.helpers.arrayElement([
                MESSAGE_TEMPLATES.progress_updates,
                MESSAGE_TEMPLATES.scheduling
            ]);
        } else {
            messageTemplates = faker.helpers.arrayElement([
                MESSAGE_TEMPLATES.student_responses,
                MESSAGE_TEMPLATES.student_progress_responses
            ]);
        }
        
        const message = createMessage(sender, messageTemplates, conversationContext, messageIndex++, currentDate);
        messages.push(message);
        
        // Advance time by 30 minutes to 2 days for next message
        const timeAdvance = faker.number.int({ min: 30, max: 2880 }) * 60 * 1000; // 30 min to 2 days
        currentDate = new Date(currentDate.getTime() + timeAdvance);
    }
    
    // Occasionally add a system message
    if (faker.datatype.boolean({ probability: 0.3 })) {
        const systemMessage = createSystemMessage(conversationContext, messageIndex++, currentDate);
        messages.push(systemMessage);
    }
    
    return messages.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Creates a regular message
 */
function createMessage(sender, templates, context, index, timestamp) {
    const template = faker.helpers.arrayElement(templates);
    let content = template
        .replace('{className}', context.className || 'your class')
        .replace('{subject}', context.subject || 'this subject')
        .replace('{time}', '2:00 PM')
        .replace('{day}', 'Wednesday')
        .replace('{date}', timestamp.toLocaleDateString())
        .replace('{topic}', context.subject || 'today\'s topic');
    
    return {
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        publicId: generatePublicMessageId(index),
        
        // Message Content
        content: content,
        type: 'text',
        
        // Sender Information
        senderId: sender.userId,
        senderName: sender.displayName,
        senderRole: sender.role,
        senderPhotoURL: sender.photoURL,
        
        // Message Properties
        isAnnouncement: false,
        isPinned: false,
        replyToMessageId: null,
        
        // Read Status (simulate some messages as read)
        readBy: faker.datatype.boolean({ probability: 0.7 }) ? {
            [sender.userId]: admin.firestore.Timestamp.fromDate(timestamp)
        } : {},
        readCount: faker.datatype.boolean({ probability: 0.7 }) ? 1 : 0,
        
        // System Data
        systemData: null,
        
        // Metadata
        timestamp: admin.firestore.Timestamp.fromDate(timestamp),
        editedAt: null,
        deletedAt: null
    };
}

/**
 * Creates a system message
 */
function createSystemMessage(context, index, timestamp) {
    const systemTemplate = faker.helpers.arrayElement(MESSAGE_TEMPLATES.system_messages);
    const content = systemTemplate.content
        .replace('{className}', context.className || 'your class')
        .replace('{date}', timestamp.toLocaleDateString())
        .replace('{time}', '2:00 PM');
    
    return {
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        publicId: generatePublicMessageId(index),
        
        // Message Content
        content: content,
        type: 'system',
        
        // Sender Information (system)
        senderId: 'system',
        senderName: 'Roots & Wings',
        senderRole: 'system',
        senderPhotoURL: null,
        
        // Message Properties
        isAnnouncement: true,
        isPinned: false,
        replyToMessageId: null,
        
        // Read Status
        readBy: {},
        readCount: 0,
        
        // System Data
        systemData: systemTemplate.data,
        
        // Metadata
        timestamp: admin.firestore.Timestamp.fromDate(timestamp),
        editedAt: null,
        deletedAt: null
    };
}

// ====================================================================================
// DATA READING FUNCTIONS
// ====================================================================================

/**
 * Reads all users for conversation participants
 */
async function getAllUsers() {
    console.log('📖 Reading users for conversation participants...');
    
    const usersSnapshot = await db.collection('users').get();
    const users = {};
    
    usersSnapshot.forEach(doc => {
        users[doc.id] = {
            userId: doc.id,
            ...doc.data()
        };
    });
    
    console.log(`✅ Found ${Object.keys(users).length} users`);
    return users;
}

/**
 * Reads all classes and their bookings to create conversations
 */
async function getClassesWithBookings() {
    console.log('📚 Reading classes and their bookings...');
    
    const classesSnapshot = await db.collection('classes').get();
    const classesWithBookings = [];
    
    for (const classDoc of classesSnapshot.docs) {
        const classData = { id: classDoc.id, ...classDoc.data() };
        
        // Get bookings for this class
        const bookingsSnapshot = await classDoc.ref.collection('bookings').get();
        const bookings = [];
        
        bookingsSnapshot.forEach(bookingDoc => {
            bookings.push({ id: bookingDoc.id, ...bookingDoc.data() });
        });
        
        if (bookings.length > 0) {
            classesWithBookings.push({
                ...classData,
                bookings: bookings
            });
        }
    }
    
    console.log(`✅ Found ${classesWithBookings.length} classes with bookings`);
    return classesWithBookings;
}

// ====================================================================================
// CONVERSATION CREATION FUNCTIONS
// ====================================================================================

/**
 * Creates a 1-on-1 conversation between student and mentor
 */
function createOneOnOneConversation(classData, booking, users, index) {
    const student = users[booking.studentId];
    const mentor = users[classData.mentorId];
    
    if (!student || !mentor) {
        console.warn(`⚠️ Missing user data for conversation (student: ${!!student}, mentor: ${!!mentor})`);
        return null;
    }
    
    const publicId = generatePublicConversationId(index);
    const conversationId = `conv_${booking.studentId}_${classData.mentorId}`;
    
    const participants = [
        {
            userId: student.userId,
            displayName: student.displayName,
            photoURL: student.photoURL,
            role: 'student',
            joinedAt: admin.firestore.Timestamp.now()
        },
        {
            userId: mentor.userId,
            displayName: mentor.displayName,
            photoURL: mentor.photoURL,
            role: 'mentor',
            joinedAt: admin.firestore.Timestamp.now()
        }
    ];
    
    // Generate messages for this conversation
    const conversationContext = {
        className: classData.title,
        subject: classData.subject,
        bookingId: booking.id
    };
    
    const messages = generateMessageSequence(participants, conversationContext);
    const lastMessage = messages[messages.length - 1];
    
    return {
        conversation: {
            conversationId: conversationId,
            publicId: publicId,
            
            // Conversation Type
            type: 'mentor_student',
            
            // Participants
            participants: participants,
            
            // Context
            relatedClassId: classData.id,
            relatedBookingId: booking.id,
            
            // Last Message (Denormalized)
            lastMessage: {
                content: lastMessage.content,
                senderId: lastMessage.senderId,
                senderName: lastMessage.senderName,
                timestamp: lastMessage.timestamp,
                type: lastMessage.type
            },
            
            // Message Stats
            totalMessages: messages.length,
            unreadCount: {
                [student.userId]: faker.number.int({ min: 0, max: 3 }),
                [mentor.userId]: faker.number.int({ min: 0, max: 2 })
            },
            
            // Conversation Settings
            settings: {
                allowFileSharing: true,
                allowVoiceMessages: false,
                autoDeleteAfterDays: null,
                isArchived: false
            },
            
            // Privacy & Moderation
            isBlocked: false,
            blockedBy: null,
            reportCount: 0,
            moderationFlags: [],
            
            // Metadata
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            lastActivityAt: lastMessage.timestamp
        },
        messages: messages
    };
}

/**
 * Creates a group conversation for batch classes
 */
function createGroupConversation(classData, users, index) {
    const mentor = users[classData.mentorId];
    
    if (!mentor) {
        console.warn(`⚠️ Missing mentor data for group conversation`);
        return null;
    }
    
    // Get all students enrolled in this batch
    const enrolledStudents = classData.bookings
        .filter(booking => booking.bookingStatus === 'confirmed')
        .map(booking => users[booking.studentId])
        .filter(student => student); // Remove any undefined users
    
    if (enrolledStudents.length < 2) {
        // Not enough students for a group chat
        return null;
    }
    
    const publicId = generatePublicConversationId(index);
    const conversationId = `group_${classData.id}`;
    
    const participants = [
        {
            userId: mentor.userId,
            displayName: mentor.displayName,
            photoURL: mentor.photoURL,
            role: 'mentor',
            joinedAt: admin.firestore.Timestamp.now()
        },
        ...enrolledStudents.map(student => ({
            userId: student.userId,
            displayName: student.displayName,
            photoURL: student.photoURL,
            role: 'student',
            joinedAt: admin.firestore.Timestamp.now()
        }))
    ];
    
    // Generate group messages
    const conversationContext = {
        className: classData.title,
        subject: classData.subject,
        isGroup: true
    };
    
    // Create messages with mixed senders from the group
    const messageCount = faker.number.int({ min: 5, max: 15 });
    const messages = [];
    let messageIndex = 0;
    
    const startDate = getConversationStartDate();
    let currentDate = new Date(startDate);
    
    // Start with mentor welcome message
    const welcomeMessage = createMessage(
        participants[0], // mentor
        MESSAGE_TEMPLATES.group_introductions,
        conversationContext,
        messageIndex++,
        currentDate
    );
    messages.push(welcomeMessage);
    
    // Generate group discussion messages
    for (let i = 1; i < messageCount; i++) {
        const sender = faker.helpers.arrayElement(participants);
        const templates = sender.role === 'mentor' ? 
            MESSAGE_TEMPLATES.group_discussions : 
            MESSAGE_TEMPLATES.group_introductions.concat(MESSAGE_TEMPLATES.group_discussions);
        
        const message = createMessage(sender, templates, conversationContext, messageIndex++, currentDate);
        messages.push(message);
        
        // Advance time
        const timeAdvance = faker.number.int({ min: 60, max: 1440 }) * 60 * 1000; // 1 hour to 1 day
        currentDate = new Date(currentDate.getTime() + timeAdvance);
    }
    
    const lastMessage = messages[messages.length - 1];
    
    return {
        conversation: {
            conversationId: conversationId,
            publicId: publicId,
            
            // Conversation Type
            type: 'group_batch',
            
            // Participants
            participants: participants,
            
            // Context
            relatedClassId: classData.id,
            relatedBatchId: classData.id,
            
            // Last Message (Denormalized)
            lastMessage: {
                content: lastMessage.content,
                senderId: lastMessage.senderId,
                senderName: lastMessage.senderName,
                timestamp: lastMessage.timestamp,
                type: lastMessage.type
            },
            
            // Message Stats
            totalMessages: messages.length,
            unreadCount: participants.reduce((acc, p) => {
                acc[p.userId] = faker.number.int({ min: 0, max: 5 });
                return acc;
            }, {}),
            
            // Conversation Settings
            settings: {
                allowFileSharing: true,
                allowVoiceMessages: false,
                autoDeleteAfterDays: null,
                isArchived: false
            },
            
            // Privacy & Moderation
            isBlocked: false,
            blockedBy: null,
            reportCount: 0,
            moderationFlags: [],
            
            // Metadata
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            lastActivityAt: lastMessage.timestamp
        },
        messages: messages
    };
}

// ====================================================================================
// POPULATION FUNCTION
// ====================================================================================

/**
 * Populates conversations and messages collections
 */
async function populateConversations() {
    console.log('🎯 Starting to populate conversations and messages...');
    
    // Read existing data
    const [users, classesWithBookings] = await Promise.all([
        getAllUsers(),
        getClassesWithBookings()
    ]);
    
    if (Object.keys(users).length === 0) {
        console.error('❌ No users found! Run populate-users.js first.');
        return;
    }
    
    if (classesWithBookings.length === 0) {
        console.error('❌ No classes with bookings found! Run populate-bookings.js first.');
        return;
    }
    
    console.log(`\n📊 Planning conversations from ${classesWithBookings.length} classes with bookings...`);
    
    let conversationsCreated = 0;
    let messagesCreated = 0;
    let globalIndex = 0;
    
    const conversationsCollection = db.collection('conversations');
    
    // Create 1-on-1 conversations from bookings
    for (const classData of classesWithBookings) {
        for (const booking of classData.bookings) {
            if (booking.bookingStatus === 'confirmed') {
                const conversationData = createOneOnOneConversation(classData, booking, users, globalIndex);
                
                if (conversationData) {
                    try {
                        // Create conversation document
                        const conversationRef = conversationsCollection.doc(conversationData.conversation.conversationId);
                        await conversationRef.set(conversationData.conversation);
                        
                        // Create messages subcollection
                        const batch = db.batch();
                        conversationData.messages.forEach(message => {
                            const messageRef = conversationRef.collection('messages').doc();
                            batch.set(messageRef, message);
                        });
                        await batch.commit();
                        
                        conversationsCreated++;
                        messagesCreated += conversationData.messages.length;
                        globalIndex++;
                        
                        if (conversationsCreated % 5 === 0) {
                            console.log(`✅ Progress: Created ${conversationsCreated} conversations with ${messagesCreated} messages`);
                        }
                        
                        // Small delay to avoid rate limiting
                        if (conversationsCreated % 10 === 0) {
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }
                        
                    } catch (error) {
                        console.error(`❌ Error creating conversation for booking ${booking.id}:`, error.message);
                    }
                }
            }
        }
    }
    
    // Create group conversations for batch classes
    const batchClasses = classesWithBookings.filter(c => c.type === 'batch');
    console.log(`\n🎓 Creating group conversations for ${batchClasses.length} batch classes...`);
    
    for (const classData of batchClasses) {
        const groupConversationData = createGroupConversation(classData, users, globalIndex);
        
        if (groupConversationData) {
            try {
                const conversationRef = conversationsCollection.doc(groupConversationData.conversation.conversationId);
                await conversationRef.set(groupConversationData.conversation);
                
                // Create messages subcollection
                const batch = db.batch();
                groupConversationData.messages.forEach(message => {
                    const messageRef = conversationRef.collection('messages').doc();
                    batch.set(messageRef, message);
                });
                await batch.commit();
                
                conversationsCreated++;
                messagesCreated += groupConversationData.messages.length;
                globalIndex++;
                
                console.log(`✅ Created group chat for "${classData.title}" with ${groupConversationData.conversation.participants.length} participants`);
                
            } catch (error) {
                console.error(`❌ Error creating group conversation for class ${classData.id}:`, error.message);
            }
        }
    }
    
    console.log(`\n🎉 Population complete! Successfully created ${conversationsCreated} conversations with ${messagesCreated} total messages.`);
    
    // Print summary statistics
    console.log('\n📊 Summary:');
    console.log('- Conversations created as top-level collection: /conversations/{id}');
    console.log('- Messages created as subcollections: /conversations/{id}/messages/{id}');
    console.log('- 1-on-1 conversations between students and mentors');
    console.log('- Group conversations for batch classes');
    console.log('- Realistic message threads with chronological flow');
    console.log('- Mixed message types: text messages and system notifications');
    console.log('- Proper read status and conversation metadata');
    console.log('- Public IDs: RW-CONV-2025-001, RW-MSG-2025-001, etc.');
    
    console.log('\n💬 Conversation Types Created:');
    const oneOnOneCount = conversationsCreated - batchClasses.length;
    console.log(`  👥 1-on-1 Conversations: ~${oneOnOneCount}`);
    console.log(`  🎓 Group Conversations: ~${batchClasses.length}`);
    console.log(`  📝 Total Messages: ${messagesCreated}`);
    console.log(`  📊 Avg Messages per Conversation: ${Math.round(messagesCreated / conversationsCreated)}`);
    
    console.log('\n🔍 To view conversations in Firebase Console:');
    console.log('   Go to conversations → Select any conversation → View "messages" subcollection');
}

// ====================================================================================
// SCRIPT EXECUTION
// ====================================================================================

// Run the population script
populateConversations()
    .then(() => {
        console.log('\n🚀 Conversations population completed successfully!');
        process.exit(0);
    })
    .catch(error => {
        console.error("💥 An unexpected error occurred:", error);
        process.exit(1);
    });