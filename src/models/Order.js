import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
    {
        customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },

        quantity: { type: Number, required: true, min: 1, default: 1 },
        price: { type: Number, required: true },  // unit price at time of order
        totalAmount: { type: Number, required: true },  // price * quantity

        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected', 'shipped', 'completed', 'cancelled'],
            default: 'pending',
        },

        shippingAddress: { type: String, required: true },
        rejectionReason: { type: String, default: '' },

        paymentDetails: {
            method: { type: String, default: '' },     // 'razorpay' | 'cod' | ''
            paymentId: { type: String, default: '' },
            orderId: { type: String, default: '' },
            status: { type: String, default: 'pending' }, // 'pending' | 'paid' | 'failed'
        },
    },
    { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
export default Order;
