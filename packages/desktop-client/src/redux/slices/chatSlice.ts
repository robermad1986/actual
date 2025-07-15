import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface ChatMessage {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: string;
    actions?: FinancialAction[];
}

export interface FinancialAction {
    type: string;
    title: string;
    description: string;
    parameters: Record<string, unknown>;
}

interface ChatState {
    isOpen: boolean;
    messages: ChatMessage[];
    isLoading: boolean;
    conversationId: string | null;
}

const initialState: ChatState = {
    isOpen: false,
    messages: [],
    isLoading: false,
    conversationId: null,
};

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        openChat: (state) => {
            state.isOpen = true;
        },
        closeChat: (state) => {
            state.isOpen = false;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        addMessage: (state, action: PayloadAction<ChatMessage>) => {
            state.messages.push(action.payload);
        },
        clearMessages: (state) => {
            state.messages = [];
        },
        setConversationId: (state, action: PayloadAction<string | null>) => {
            state.conversationId = action.payload;
        },
    },
});

export const {
    openChat,
    closeChat,
    setLoading,
    addMessage,
    clearMessages,
    setConversationId,
} = chatSlice.actions;

export { chatSlice };
export const chatReducer = chatSlice.reducer;
