import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { sendSuccess, sendError } from '../utils/response.js';

// GET /chat/conversations
export const getConversations = async (req, res) => {
    try {
        const convs = await Conversation.find({ participants: req.user._id })
            .populate('participants', 'name avatar role')
            .sort({ lastMessageTime: -1 });

        // Attach the "other user" for each conversation
        const result = convs.map(c => {
            const obj = c.toObject();
            obj.otherUser = obj.participants.find(p => String(p._id) !== String(req.user._id));
            return obj;
        });

        return sendSuccess(res, result, 'Conversations fetched');
    } catch (err) {
        return sendError(res, err.message);
    }
};

// POST /chat/conversations
export const createConversation = async (req, res) => {
    try {
        const { userId } = req.body;
        if (String(userId) === String(req.user._id)) {
            return sendError(res, 'Cannot create conversation with yourself', 400);
        }

        // Check if conversation already exists
        let conv = await Conversation.findOne({
            participants: { $all: [req.user._id, userId] },
        });

        if (!conv) {
            conv = await Conversation.create({ participants: [req.user._id, userId] });
        }

        await conv.populate('participants', 'name avatar role');
        return sendSuccess(res, conv, 'Conversation ready', 201);
    } catch (err) {
        return sendError(res, err.message);
    }
};

// GET /chat/conversations/:id/messages
export const getMessages = async (req, res) => {
    try {
        const conv = await Conversation.findOne({
            _id: req.params.id,
            participants: req.user._id,
        });
        if (!conv) return sendError(res, 'Conversation not found', 404);

        const messages = await Message.find({ conversation: req.params.id })
            .populate('sender', 'name avatar')
            .sort({ createdAt: 1 });

        return sendSuccess(res, messages, 'Messages fetched');
    } catch (err) {
        return sendError(res, err.message);
    }
};

// POST /chat/conversations/:id/messages
export const sendMessage = async (req, res) => {
    try {
        const conv = await Conversation.findOne({
            _id: req.params.id,
            participants: req.user._id,
        });
        if (!conv) return sendError(res, 'Conversation not found', 404);

        const msg = await Message.create({
            conversation: req.params.id,
            sender: req.user._id,
            text: req.body.text,
            readBy: [req.user._id],
        });

        // Update last message
        conv.lastMessage = req.body.text;
        conv.lastMessageTime = new Date();
        await conv.save();

        await msg.populate('sender', 'name avatar');
        return sendSuccess(res, msg, 'Message sent', 201);
    } catch (err) {
        return sendError(res, err.message);
    }
};

// PATCH /chat/conversations/:id/read
export const markAsRead = async (req, res) => {
    try {
        await Message.updateMany(
            { conversation: req.params.id, readBy: { $ne: req.user._id } },
            { $addToSet: { readBy: req.user._id } }
        );
        return sendSuccess(res, null, 'Messages marked as read');
    } catch (err) {
        return sendError(res, err.message);
    }
};
