import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Reward } from '../../types';

interface RewardsState {
  availableRewards: Reward[];
  redeemedRewards: Reward[];
}

const mockRewards: Reward[] = [
  {
    id: '1',
    title: '5% Off Groceries',
    description: 'Get 5% discount at participating supermarkets',
    pointsCost: 100,
    category: 'supermarket',
    discountPercentage: 5,
    isRedeemed: false,
  },
  {
    id: '2',
    title: '10% Off Public Transport',
    description: 'Save 10% on your next bus or train ticket',
    pointsCost: 80,
    category: 'transport',
    discountPercentage: 10,
    isRedeemed: false,
  },
  {
    id: '3',
    title: 'Free Coffee',
    description: 'Enjoy a free coffee at participating cafes',
    pointsCost: 50,
    category: 'food',
    discountPercentage: 100,
    isRedeemed: false,
  },
  {
    id: '4',
    title: '15% Off Cinema Tickets',
    description: 'Get discount on movie tickets',
    pointsCost: 120,
    category: 'entertainment',
    discountPercentage: 15,
    isRedeemed: false,
  },
  {
    id: '5',
    title: '20% Off Organic Food',
    description: 'Special discount on organic products',
    pointsCost: 150,
    category: 'supermarket',
    discountPercentage: 20,
    isRedeemed: false,
  },
];

const initialState: RewardsState = {
  availableRewards: mockRewards,
  redeemedRewards: [],
};

const rewardsSlice = createSlice({
  name: 'rewards',
  initialState,
  reducers: {
    redeemReward: (state, action: PayloadAction<string>) => {
      const rewardIndex = state.availableRewards.findIndex(reward => reward.id === action.payload);
      if (rewardIndex !== -1) {
        const reward = state.availableRewards[rewardIndex];
        const redeemedReward = {
          ...reward,
          isRedeemed: true,
          redeemedAt: new Date(),
          qrCode: `QR-${reward.id}-${Date.now()}`, // Mock QR code
        };
        state.redeemedRewards.push(redeemedReward);
        // Keep the reward available for future redemption
        // state.availableRewards.splice(rewardIndex, 1);
      }
    },
    addReward: (state, action: PayloadAction<Omit<Reward, 'id' | 'isRedeemed'>>) => {
      const newReward: Reward = {
        ...action.payload,
        id: Date.now().toString(),
        isRedeemed: false,
      };
      state.availableRewards.push(newReward);
    },
    clearRedeemedRewards: (state) => {
      state.redeemedRewards = [];
    },
    updateReward: (state, action: PayloadAction<{ id: string; updates: Partial<Reward> }>) => {
      const rewardIndex = state.availableRewards.findIndex(reward => reward.id === action.payload.id);
      if (rewardIndex !== -1) {
        state.availableRewards[rewardIndex] = {
          ...state.availableRewards[rewardIndex],
          ...action.payload.updates,
        };
      }
    },
  },
});

export const { redeemReward, addReward, clearRedeemedRewards, updateReward } = rewardsSlice.actions;
export default rewardsSlice.reducer; 