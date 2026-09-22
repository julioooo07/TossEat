// context/ChatbotContext.js
import React, { createContext, useState, useContext } from 'react';
import { menuItems } from '../data/menuItems';

const ChatbotContext = createContext();

export const useChatbot = () => {
  return useContext(ChatbotContext);
};

export const ChatbotProvider = ({ children }) => {
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [userPreferences, setUserPreferences] = useState(null);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [chatbotStep, setChatbotStep] = useState(0);

  const chatbotQuestions = [
    {
      id: 1,
      question: "Welcome to Hungry Nook! I'd like to get to know your food preferences to recommend the perfect dishes for you. What's your average budget per meal?",
      type: "budget",
      options: ["Under ₱100", "₱100-₱200", "₱200-₱300", "₱300-₱500", "Over ₱500"]
    },
    {
      id: 2,
      question: "Great! Do you follow any specific diet?",
      type: "diet",
      options: ["None", "Vegetarian", "Vegan", "Low-carb", "Keto", "Pescatarian", "Gluten-free"]
    },
    {
      id: 3,
      question: "Any food allergies or intolerances?",
      type: "allergies",
      options: ["None", "Dairy", "Nuts", "Seafood", "Eggs", "Gluten", "Soy"]
    },
    {
      id: 4,
      question: "How do you feel about spicy food?",
      type: "spiceLevel",
      options: ["No spice", "Mild", "Medium", "Spicy", "Extra spicy"]
    },
    {
      id: 5,
      question: "What type of cuisine do you prefer?",
      type: "cuisine",
      options: ["Western", "Asian", "Fusion", "Comfort food", "Healthy", "All types"]
    },
    {
      id: 6,
      question: "Any protein preferences?",
      type: "protein",
      options: ["Chicken", "Beef", "Pork", "Seafood", "Vegetarian", "All"]
    },
    {
      id: 7,
      question: "How about meal times? When do you usually eat?",
      type: "mealTime",
      options: ["Breakfast", "Lunch", "Dinner", "Snacks", "All day"]
    }
  ];

const analyzePreferences = (preferences) => {
  let filteredItems = [...menuItems];
  
  // Filter by budget
  if (preferences.budget === "Under ₱100") {
    filteredItems = filteredItems.filter(item => {
      const price = item.variants?.[0]?.price || item.price || 0;
      return price < 100;
    });
  } else if (preferences.budget === "₱100-₱200") {
    filteredItems = filteredItems.filter(item => {
      const price = item.variants?.[0]?.price || item.price || 0;
      return price >= 100 && price <= 200;
    });
  } else if (preferences.budget === "₱200-₱300") {
    filteredItems = filteredItems.filter(item => {
      const price = item.variants?.[0]?.price || item.price || 0;
      return price >= 200 && price <= 300;
    });
  } else if (preferences.budget === "₱300-₱500") {
    filteredItems = filteredItems.filter(item => {
      const price = item.variants?.[0]?.price || item.price || 0;
      return price >= 300 && price <= 500;
    });
  } else if (preferences.budget === "Over ₱500") {
    filteredItems = filteredItems.filter(item => {
      const price = item.variants?.[0]?.price || item.price || 0;
      return price > 500;
    });
  }
  
  // Filter by diet - add safe checks
  if (preferences.diet === "Vegetarian") {
    filteredItems = filteredItems.filter(item => {
      const name = item.name?.toLowerCase() || '';
      const category = item.category?.toLowerCase() || '';
      const description = item.description?.toLowerCase() || '';
      
      return !category.includes('chicken') && 
        !category.includes('beef') && 
        !category.includes('pork') &&
        !name.includes('chicken') &&
        !name.includes('beef') &&
        !name.includes('pork') &&
        !name.includes('meat') &&
        !description.includes('chicken') &&
        !description.includes('beef') &&
        !description.includes('pork') &&
        !description.includes('meat');
    });
  } else if (preferences.diet === "Vegan") {
    filteredItems = filteredItems.filter(item => {
      const name = item.name?.toLowerCase() || '';
      const category = item.category?.toLowerCase() || '';
      const description = item.description?.toLowerCase() || '';
      
      return !category.includes('cheese') &&
        !name.includes('cheese') &&
        !name.includes('cream') &&
        !description.includes('cheese') &&
        !description.includes('cream');
    });
  }
  
  // Filter by allergies - add safe checks
  if (preferences.allergies === "Dairy") {
    filteredItems = filteredItems.filter(item => {
      const name = item.name?.toLowerCase() || '';
      const description = item.description?.toLowerCase() || '';
      
      return !name.includes('cheese') &&
        !description.includes('cheese') &&
        !description.includes('cream');
    });
  } else if (preferences.allergies === "Nuts") {
    filteredItems = filteredItems.filter(item => {
      const name = item.name?.toLowerCase() || '';
      const description = item.description?.toLowerCase() || '';
      
      return !name.includes('peanut') &&
        !description.includes('peanut') &&
        !description.includes('nut');
    });
  } else if (preferences.allergies === "Seafood") {
    filteredItems = filteredItems.filter(item => {
      const name = item.name?.toLowerCase() || '';
      const description = item.description?.toLowerCase() || '';
      
      return !name.includes('salmon') &&
        !name.includes('fish') &&
        !name.includes('seafood') &&
        !description.includes('salmon') &&
        !description.includes('fish') &&
        !description.includes('seafood');
    });
  }
  
  // Filter by protein preference - add safe checks
  if (preferences.protein === "Chicken") {
    filteredItems = filteredItems.filter(item => {
      const name = item.name?.toLowerCase() || '';
      const category = item.category?.toLowerCase() || '';
      const description = item.description?.toLowerCase() || '';
      
      return name.includes('chicken') ||
        category.includes('chicken') ||
        description.includes('chicken');
    });
  } else if (preferences.protein === "Beef") {
    filteredItems = filteredItems.filter(item => {
      const name = item.name?.toLowerCase() || '';
      const description = item.description?.toLowerCase() || '';
      
      return name.includes('beef') ||
        description.includes('beef');
    });
  } else if (preferences.protein === "Pork") {
    filteredItems = filteredItems.filter(item => {
      const name = item.name?.toLowerCase() || '';
      const description = item.description?.toLowerCase() || '';
      
      return name.includes('pork') ||
        name.includes('tonkatsu') ||
        description.includes('pork');
    });
  } else if (preferences.protein === "Seafood") {
    filteredItems = filteredItems.filter(item => {
      const name = item.name?.toLowerCase() || '';
      const description = item.description?.toLowerCase() || '';
      
      return name.includes('salmon') ||
        name.includes('fish') ||
        description.includes('salmon') ||
        description.includes('fish');
    });
  }
  
  // Score items based on preferences
  const scoredItems = filteredItems.map(item => {
    let score = 0;
    const name = item.name?.toLowerCase() || '';
    const description = item.description?.toLowerCase() || '';
    const flavors = item.flavors || [];
    
    // Spice level matching
    if (preferences.spiceLevel === "No spice") {
      if (!description.includes('spicy') && 
          !flavors.some(f => f?.toLowerCase().includes('spicy'))) {
        score += 3;
      }
    } else if (preferences.spiceLevel === "Spicy" || preferences.spiceLevel === "Extra spicy") {
      if (description.includes('spicy') || 
          flavors.some(f => f?.toLowerCase().includes('spicy'))) {
        score += 3;
      }
    }
    
    // Cuisine preference
    if (preferences.cuisine === "Comfort food") {
      const category = item.category?.toLowerCase() || '';
      if (category.includes('burgers') || 
          category.includes('pasta') ||
          category.includes('pizza')) {
        score += 2;
      }
    } else if (preferences.cuisine === "Healthy") {
      if (description.includes('salmon') ||
          description.includes('vegetable') ||
          description.includes('salad') ||
          name.includes('salad')) {
        score += 2;
      }
    } else if (preferences.cuisine === "Asian") {
      if (name.includes('teriyaki') ||
          name.includes('soy') ||
          name.includes('korean') ||
          description.includes('asian')) {
        score += 2;
      }
    }
    
    // Meal time preference
    if (preferences.mealTime === "Lunch") {
      const category = item.category?.toLowerCase() || '';
      if (category.includes('ricemeals') || 
          category.includes('combomeals') ||
          category.includes('bentomeals')) {
        score += 2;
      }
    } else if (preferences.mealTime === "Dinner") {
      const category = item.category?.toLowerCase() || '';
      if (category.includes('pizza') || 
          category.includes('bilao') ||
          category.includes('pasta') ||
          category.includes('chickenwings')) {
        score += 2;
      }
    } else if (preferences.mealTime === "Snacks") {
      const category = item.category?.toLowerCase() || '';
      if (category.includes('fries') || 
          category.includes('sandwiches') ||
          category.includes('drinks')) {
        score += 2;
      }
    }
    
    return { ...item, recommendationScore: score };
  });
  
  // Sort by recommendation score and get top 6
  const topRecommendations = scoredItems
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, 6);
  
  return topRecommendations;
};

const startChatbot = (firstLogin = false) => {
  if (typeof window !== 'undefined') {
    const userId = localStorage.getItem('user_id') || 'current_user';
    const hasCompleted = localStorage.getItem(`preferences_completed_${userId}`);
    
    // Check if we're already on the recommendations page
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    
    if (hasCompleted === 'true' && firstLogin) {
      // Only redirect if we're NOT already on the menu page with recommendations
      if (!(currentPath === '/menu' && currentSearch.includes('showRecs=true'))) {
        window.location.href = '/menu?category=RECOMMENDED&showRecs=true';
      }
      return;
    }
  } 
  
  setIsFirstLogin(firstLogin);
  setChatbotOpen(true);
  setChatbotStep(0);
  setChatHistory([{
    id: 1,
    sender: 'bot',
    message: "👋 Welcome to Hungry Nook! Let's personalize your experience. I'll ask a few questions to understand your food preferences and recommend the perfect dishes for you!",
    timestamp: new Date()
  }, {
    id: 2,
    sender: 'bot',
    message: chatbotQuestions[0].question,
    timestamp: new Date()
  }]);
};

  const sendMessage = (message) => {
    const newChatHistory = [
      ...chatHistory,
      {
        id: chatHistory.length + 1,
        sender: 'user',
        message,
        timestamp: new Date()
      }
    ];
    
    setChatHistory(newChatHistory);
    
    // Process response and get next question
    setTimeout(() => {
      processUserResponse(message);
    }, 500);
  };

 const processUserResponse = (response) => {
  const currentQuestion = chatbotQuestions[chatbotStep];
  

  
  // Move to next question
  if (chatbotStep < chatbotQuestions.length - 1) {
    const nextStep = chatbotStep + 1;
    setChatbotStep(nextStep);
    
    const botResponse = {
      id: chatHistory.length + 2,
      sender: 'bot',
      message: chatbotQuestions[nextStep].question,
      timestamp: new Date()
    };
    
    setChatHistory(prev => [...prev, botResponse]);
  } else {
    // All questions answered - generate recommendations
    const finalPreferences = {
      ...userPreferences,
      [currentQuestion.type]: response
    };
    
    const recommendations = analyzePreferences(finalPreferences);
    setRecommendations(recommendations);  // Set recommendations in state
    
    // Store preferences and recommendations in localStorage
    if (typeof window !== 'undefined') {
      const userId = localStorage.getItem('user_id') || 'current_user';
      localStorage.setItem(`user_preferences_${userId}`, JSON.stringify(finalPreferences));
      localStorage.setItem(`preferences_completed_${userId}`, 'true');
      localStorage.setItem(`user_recommendations_${userId}`, JSON.stringify(recommendations));
      
      // Reset the "has seen recommendations" flag so user sees them
      localStorage.removeItem('has_seen_first_recs');
    }
    
    const completionMessage = {
      id: chatHistory.length + 2,
      sender: 'bot',
      message: `Thank you for sharing your preferences! 🎉 Based on your choices, I've found ${recommendations.length} perfect dishes for you. You'll now be redirected to see your personalized recommendations!`,
      timestamp: new Date()
    };
    
    setChatHistory(prev => [...prev, completionMessage]);
    
setTimeout(() => {
  setChatbotOpen(false);
  // Mark that user has seen recommendations
  const userId = localStorage.getItem('user_id') || 'current_user';
  localStorage.setItem(`has_seen_first_recs_${userId}`, 'true');
  
  // Use a timeout to ensure state is updated before redirect
  setTimeout(() => {
    // Redirect to menu with recommendations
    window.location.href = '/menu?category=RECOMMENDED&showRecs=true';
  }, 500000);
}, 20000000);
  }
};

  const closeChatbot = () => {
    setChatbotOpen(false);
    setChatHistory([]);
    setChatbotStep(0);
  };

  const value = {
    chatbotOpen,
    chatHistory,
    userPreferences,
    recommendations,
    isFirstLogin,
    startChatbot,
    sendMessage,
    closeChatbot,
    chatbotQuestions,
    chatbotStep,
    setRecommendations  
  };

  return (
    <ChatbotContext.Provider value={value}>
      {children}
    </ChatbotContext.Provider>
  );
};