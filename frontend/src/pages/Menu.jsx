import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useChatbot } from '../context/ChatbotContext';
import { menuItems, CHICKEN_WING_FLAVORS } from '../data/menuItems';
import './Menu.css';

const keepCurrentMenuItems = (items) => items.filter(item =>
  menuItems.some(menuItem => String(menuItem.id) === String(item.id))
);

const Menu = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { recommendations, startChatbot, setRecommendations } = useChatbot(); // Add setRecommendations
  
  const [addingItem, setAddingItem] = useState(null);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [filteredItems, setFilteredItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [priceRange, setPriceRange] = useState('All Prices');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFlavors, setSelectedFlavors] = useState({});
  const [extraFlavorEnabled, setExtraFlavorEnabled] = useState({});
  const [selectedAdditionalFlavors, setSelectedAdditionalFlavors] = useState({});
  const [selectedVariants, setSelectedVariants] = useState({});
  const [showBilaoModal, setShowBilaoModal] = useState(false);
  const [selectedBilaoItem, setSelectedBilaoItem] = useState(null);
  const [selectedBilaoFlavors, setSelectedBilaoFlavors] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Add this line

  // Add to categories array
  const categories = [
    'ALL', 'RECOMMENDED', 'UNLIMITEDWINGS', 'CHICKENWINGS', 'DIPS', 'ADDONS', 'DRINKS'
  ];

  const priceRanges = ['All Prices', 'Under ₱100', '₱100 - ₱200', '₱200 - ₱300', '₱300 - ₱500', 'Over ₱500'];

  // First useEffect - load stored recommendations
  useEffect(() => {
    if (user) {
      const userId = user.id || user.email || user._id;
      const storedRecs = localStorage.getItem(`user_recommendations_${userId}`);
      
      if (storedRecs && recommendations.length === 0) {
        try {
          const parsedRecs = keepCurrentMenuItems(JSON.parse(storedRecs));
          if (setRecommendations) {
            setRecommendations(parsedRecs);
          }
        } catch (error) {
        }
      }
    }
  }, [user, recommendations.length, setRecommendations]);

  // Second useEffect - handle URL parameters and auto-show recommendations
  useEffect(() => {
    // Don't run on initial load if we have URL params
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const showRecs = searchParams.get('showRecs');
    const categoryParam = searchParams.get('category');
    
    // Clear URL parameters to prevent infinite refresh
    if (showRecs === 'true' || categoryParam === 'RECOMMENDED') {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
    
    // Load stored recommendations if needed
    if ((showRecs === 'true' || categoryParam === 'RECOMMENDED') && recommendations.length === 0 && user) {
      const userId = user.id || user.email || user._id;
      const storedRecs = localStorage.getItem(`user_recommendations_${userId}`);
      
      if (storedRecs) {
        try {
          const parsedRecs = keepCurrentMenuItems(JSON.parse(storedRecs));
          if (setRecommendations) {
            setRecommendations(parsedRecs);
            setShowRecommendations(true);
            setFilteredItems(parsedRecs);
            setActiveCategory('RECOMMENDED');
          }
        } catch (error) {
        }
      }
    }
    
    // Auto-show recommendations for first-time users after completion
    if (recommendations.length > 0 && !localStorage.getItem('has_seen_first_recs')) {
      const userId = user?.id || user?.email || user?._id;
      if (userId) {
        const hasCompleted = localStorage.getItem(`preferences_completed_${userId}`);
        if (hasCompleted === 'true') {
          localStorage.setItem('has_seen_first_recs', 'true');
          setShowRecommendations(true);
          setFilteredItems(recommendations);
          setActiveCategory('RECOMMENDED');
        }
      }
    }
  }, [recommendations, user, setRecommendations, isInitialLoad]);

  // Third useEffect - handle filtering logic
  useEffect(() => {
    // Don't run this effect if we're showing recommendations
    if (showRecommendations && activeCategory === 'RECOMMENDED') {
      return;
    }

    // Handle RECOMMENDED category specially - check if we have recommendations
    if (activeCategory === 'RECOMMENDED') {
      if (recommendations.length > 0) {
        setShowRecommendations(true);
        setFilteredItems(recommendations);
        return;
      } else {
        // No recommendations yet
        setShowRecommendations(false);
        setFilteredItems([]);
        return;
      }
    }

    // Normal filtering for other categories
    const newFilteredItems = menuItems.filter(item => {
      const matchesCategory = activeCategory === 'ALL' || item.category === activeCategory;
      
      let p = (item.variants?.length
        ? (item.variants.find(v => v.label === (selectedVariants[item.id] ?? item.variants[0].label)) || item.variants[0])?.price
        : item.price);
      if (p != null && item.extraFlavorPrice && extraFlavorEnabled[item.id]) p += item.extraFlavorPrice;

      let matchesPrice = true;
      switch (priceRange) {
        case 'Under ₱100': matchesPrice = p == null ? true : p < 100; break;
        case '₱100 - ₱200': matchesPrice = p == null ? true : (p >= 100 && p <= 200); break;
        case '₱200 - ₱300': matchesPrice = p == null ? true : (p >= 200 && p <= 300); break;
        case '₱300 - ₱500': matchesPrice = p == null ? true : (p >= 300 && p <= 500); break;
        case 'Over ₱500': matchesPrice = p == null ? true : p > 500; break;
        default: matchesPrice = true;
      }

      const matchesSearch =
        `${item.name} ${item.description}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      return matchesCategory && matchesPrice && matchesSearch;
    });
    
    setFilteredItems(newFilteredItems);
    setShowRecommendations(false);
  }, [
    activeCategory,
    priceRange,
    searchTerm,
    selectedVariants,
    extraFlavorEnabled,
    showRecommendations,
    recommendations
  ]);

  // Update the RecommendationBanner component
  const RecommendationBanner = () => {
    if (!showRecommendations || recommendations.length === 0) return null;
    
    const resetToAllItems = () => {
      setShowRecommendations(false);
      setActiveCategory('ALL');
      // Reset to show all items
      setFilteredItems(menuItems.filter(item => {
        const matchesCategory = activeCategory === 'ALL' || item.category === activeCategory;
        let p = (item.variants?.length
          ? (item.variants.find(v => v.label === (selectedVariants[item.id] ?? item.variants[0].label)) || item.variants[0])?.price
          : item.price);
        if (p != null && item.extraFlavorPrice && extraFlavorEnabled[item.id]) p += item.extraFlavorPrice;

        let matchesPrice = true;
        switch (priceRange) {
          case 'Under ₱100': matchesPrice = p == null ? true : p < 100; break;
          case '₱100 - ₱200': matchesPrice = p == null ? true : (p >= 100 && p <= 200); break;
          case '₱200 - ₱300': matchesPrice = p == null ? true : (p >= 200 && p <= 300); break;
          case '₱300 - ₱500': matchesPrice = p == null ? true : (p >= 300 && p <= 500); break;
          case 'Over ₱500': matchesPrice = p == null ? true : p > 500; break;
          default: matchesPrice = true;
        }

        const matchesSearch = `${item.name} ${item.description}`.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesPrice && matchesSearch;
      }));
    };

    return (
      <div className="recommendation-banner">
        <div className="recommendation-content">
          <div>
            <h3>Personalized Recommendations</h3>
            <p>Based on your food preferences</p>
          </div>
        </div>
        <div className="recommendation-actions">
          <button 
            className="btn btn-outline"
            onClick={resetToAllItems}
          >
            Show All Menu
          </button>
        </div>
      </div>
    );
  };

  const displayPrice = (item) => {
    const extraFlavorCost = item.extraFlavorPrice && extraFlavorEnabled[item.id] ? item.extraFlavorPrice : 0;
    if (item.variants?.length) {
      const chosen = selectedVariants[item.id] ?? item.variants[0].label;
      const v = item.variants.find(x => x.label === chosen) || item.variants[0];
      return v.price == null ? 'TBD' : `₱${v.price + extraFlavorCost}`;
    }
    return item.price == null ? 'TBD' : `₱${item.price + extraFlavorCost}`;
  };

  const chargePrice = (item) => {
    const extraFlavorCost = item.extraFlavorPrice && extraFlavorEnabled[item.id] ? item.extraFlavorPrice : 0;
    if (item.variants?.length) {
      const chosen = selectedVariants[item.id] ?? item.variants[0].label;
      const v = item.variants.find(x => x.label === chosen) || item.variants[0];
      return (v.price ?? 0) + extraFlavorCost;
    }
    return (item.price ?? 0) + extraFlavorCost;
  };

  const openBilaoModal = (item) => {
    setSelectedBilaoItem(item);
    setSelectedBilaoFlavors([]);
    setShowBilaoModal(true);
  };

  const closeBilaoModal = () => {
    setShowBilaoModal(false);
    setSelectedBilaoItem(null);
    setSelectedBilaoFlavors([]);
  };

  const handleBilaoFlavorToggle = (flavor) => {
    setSelectedBilaoFlavors(prev => {
      const maxFlavors = selectedBilaoItem?.variants?.find(v => 
        v.label === (selectedVariants[selectedBilaoItem.id] || selectedBilaoItem.variants[0].label)
      )?.maxFlavors || 4;

      if (prev.includes(flavor)) {
        return prev.filter(f => f !== flavor);
      } else {
        if (prev.length < maxFlavors) {
          return [...prev, flavor];
        }
        return prev;
      }
    });
  };

  const handleBilaoAddToCart = async () => {
    if (!user) {
      alert('Please log in to add items to cart');
      return;
    }

    const selectedVariant = selectedVariants[selectedBilaoItem.id] || selectedBilaoItem.variants[0].label;
    const maxFlavors = selectedBilaoItem.variants.find(v => v.label === selectedVariant)?.maxFlavors || 4;
    
    if (selectedBilaoFlavors.length !== maxFlavors) {
      alert(`Please select exactly ${maxFlavors} flavors for this bilao.`);
      return;
    }

    setAddingItem(selectedBilaoItem.id);

    const result = await addToCart({
      itemId: selectedBilaoItem.id.toString(),
      name: `${selectedBilaoItem.name} (${selectedVariant})`,
      price: chargePrice(selectedBilaoItem),
      quantity: 1,
      size: selectedVariant,
      flavor: selectedBilaoFlavors.join(', '),
      notes: `Flavors: ${selectedBilaoFlavors.join(', ')}`
    });

    if (result?.success) {
      alert('Bilao added to cart!');
      closeBilaoModal();
    } else {
      alert('Failed to add bilao to cart: ' + (result?.message || 'Unknown error'));
    }
    setAddingItem(null);
  };

  const handleFlavorChange = (itemId, flavor) => {
    setSelectedFlavors(prev => ({ ...prev, [itemId]: flavor }));
    const item = menuItems.find(menuItem => menuItem.id === itemId);
    if (item?.extraFlavorPrice && selectedAdditionalFlavors[itemId] === flavor) {
      setSelectedAdditionalFlavors(prev => ({
        ...prev,
        [itemId]: item.flavors.find(availableFlavor => availableFlavor !== flavor)
      }));
    }
  };

  const handleVariantChange = (itemId, label) => {
    setSelectedVariants(prev => ({ ...prev, [itemId]: label }));
  };

  const handleAddToCart = async (item) => {
    if (!user) {
      alert('Please log in to add items to cart');
      return;
    }

    if (item.isBilao) {
      openBilaoModal(item);
      return;
    }

    setAddingItem(item.id);

    const selectedFlavor = selectedFlavors[item.id] || (item.hasFlavor ? (item.flavors?.[0] ?? 'Original') : 'Original');
    const additionalFlavor = selectedAdditionalFlavors[item.id];
    const chosenFlavors = additionalFlavor && extraFlavorEnabled[item.id]
      ? `${selectedFlavor}, ${additionalFlavor}`
      : selectedFlavor;
    const selectedVariant = selectedVariants[item.id] ?? (item.variants?.[0]?.label || 'Regular');
    const price = chargePrice(item);

    const result = await addToCart({
      itemId: item.id.toString(),
      name: item.name + (item.variants?.length ? ` (${selectedVariant})` : ''),
      price,
      quantity: 1,
      size: selectedVariant,
      flavor: chosenFlavors,
      notes: item.isUnlimitedWings ? item.notes : (additionalFlavor && extraFlavorEnabled[item.id] ? 'Second flavor add-on (+₱10)' : '')
    });

    if (result?.success) {
      alert('Item added to cart!');
    } else {
      alert('Failed to add item to cart: ' + (result?.message || 'Unknown error'));
    }
    setAddingItem(null);
  };

  return (
    <div className="menu-container-nook">
      <RecommendationBanner />
      <div className="nook-header">
        <div className="header-content">
          <div className="nook-logo">Toss Eat</div>

          <div className="price-filter-section">
            <label>Price Range:</label>
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="price-select"
            >
              {priceRanges.map(range => (<option key={range} value={range}>{range}</option>))}
            </select>
          </div>

          <div className="search-container">
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>
      <section className="house-rules" aria-labelledby="house-rules-title">
        <h2 id="house-rules-title">Unlimited Wings House Rules</h2>
        <ul>
          <li>One flavor per customer upon refill.</li>
          <li>No leftovers.</li>
          <li>Leftover chicken: ₱30 per piece.</li>
          <li>Pulled chicken: ₱150 per table.</li>
        </ul>
      </section>
      <div className="category-nav">
        <div className="category-scroll">
          {categories.map(category => (
            <button
              key={category}
              className={`category-tab ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category.replace(/([A-Z])/g, ' $1').replace(/^ /, '')}
            </button>
          ))}
        </div>
      </div>

      <div className="menu-grid-nook">
        {filteredItems.length === 0 ? (
          <div className="no-items">
            {activeCategory === 'RECOMMENDED' && recommendations.length === 0 ? (
              <>
                <h3>No personalized recommendations yet</h3>
                <p>Complete our food preference quiz to get personalized dish recommendations!</p>
                <button 
                  className="get-recommendations-btn"
                  onClick={() => {
                    startChatbot();
                  }}
                >
                  🎯 Get Personalized Recommendations
                </button>
              </>
            ) : (
              <>
                <h3>No items found</h3>
                <p>Try adjusting your filters or search term</p>
              </>
            )}
          </div>
        ) : (
          filteredItems.map(item => {
            const hasVariants = !!item.variants?.length;
            const variantLabel = selectedVariants[item.id] ?? (hasVariants ? item.variants[0].label : null);

            return (
              <div key={item.id} className="menu-card">
                <div className="card-image">
                  <img src={item.image} alt={item.name} />
                  {item.popular && <span className="popular-badge">Popular</span>}
                </div>

                <div className="card-content">
                  <h3>{item.name}</h3>
                  <p className="card-description">{item.description}</p>
                  {hasVariants && (
                    <div className="variant-section">
                      <label className="variant-label">Choose Size/Set:</label>
                      <select
                        className="variant-select"
                        value={variantLabel}
                        onChange={(e) => handleVariantChange(item.id, e.target.value)}
                      >
                        {item.variants.map(v => (
                          <option key={v.label} value={v.label}>
                            {v.label} — {v.price == null ? 'TBD' : `₱${v.price}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {item.hasFlavor && item.flavors?.length > 0 && !item.isBilao && (
                    <div className="flavor-section">
                      <label className="flavor-label">Choose Flavor:</label>
                      <select
                        value={selectedFlavors[item.id] || item.flavors[0]}
                        onChange={(e) => handleFlavorChange(item.id, e.target.value)}
                        className="flavor-select"
                      >
                        {item.flavorGroups
                          ? item.flavorGroups.map(group => (
                            <optgroup key={group.label} label={group.label}>
                              {group.flavors.map(flavor => <option key={flavor} value={flavor}>{flavor}</option>)}
                            </optgroup>
                          ))
                          : item.flavors.map(flavor => <option key={flavor} value={flavor}>{flavor}</option>)}
                      </select>
                    </div>
                  )}

                  {item.extraFlavorPrice && (
                    <div className="extra-flavor-option">
                      <label>
                        <input
                          type="checkbox"
                          checked={!!extraFlavorEnabled[item.id]}
                          onChange={(event) => {
                            const enabled = event.target.checked;
                            setExtraFlavorEnabled(previous => ({ ...previous, [item.id]: enabled }));
                            if (enabled && !selectedAdditionalFlavors[item.id]) {
                              const primaryFlavor = selectedFlavors[item.id] || item.flavors[0];
                              setSelectedAdditionalFlavors(previous => ({
                                ...previous,
                                [item.id]: item.flavors.find(flavor => flavor !== primaryFlavor)
                              }));
                            }
                          }}
                        />
                        Add a second flavor (+₱{item.extraFlavorPrice})
                      </label>
                      {extraFlavorEnabled[item.id] && (
                        <select
                          value={selectedAdditionalFlavors[item.id] || item.flavors.find(flavor => flavor !== (selectedFlavors[item.id] || item.flavors[0])) || item.flavors[0]}
                          onChange={(event) => setSelectedAdditionalFlavors(previous => ({ ...previous, [item.id]: event.target.value }))}
                          className="flavor-select"
                          aria-label="Choose a second flavor"
                        >
                          {item.flavorGroups
                            ? item.flavorGroups.map(group => {
                              const availableFlavors = group.flavors.filter(flavor => flavor !== (selectedFlavors[item.id] || item.flavors[0]));
                              return availableFlavors.length ? (
                                <optgroup key={group.label} label={group.label}>
                                  {availableFlavors.map(flavor => <option key={flavor} value={flavor}>{flavor}</option>)}
                                </optgroup>
                              ) : null;
                            })
                            : item.flavors.filter(flavor => flavor !== (selectedFlavors[item.id] || item.flavors[0])).map(flavor => (
                              <option key={flavor} value={flavor}>{flavor}</option>
                            ))}
                        </select>
                      )}
                    </div>
                  )}

                  {item.notes && <div className="price-note">{item.notes}</div>}
                </div>

                <div className="card-footer">
                  <div className="card-price">{displayPrice(item)}</div>
                  <button
                    className="add-btn-small"
                    onClick={() => handleAddToCart(item)}
                    disabled={addingItem === item.id}
                  >
                    {addingItem === item.id ? 'Adding…' : item.isBilao ? 'Select Flavors' : item.isUnlimitedWings ? 'Add 1 person' : 'Add'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showBilaoModal && selectedBilaoItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{selectedBilaoItem.name}</h3>
              <button className="modal-close" onClick={closeBilaoModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="bilao-variant-section">
                <label>Select Bilao Size:</label>
                <select
                  value={selectedVariants[selectedBilaoItem.id] || selectedBilaoItem.variants[0].label}
                  onChange={(e) => handleVariantChange(selectedBilaoItem.id, e.target.value)}
                  className="variant-select"
                >
                  {selectedBilaoItem.variants.map(v => (
                    <option key={v.label} value={v.label}>
                      {v.label} — ₱{v.price}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bilao-flavors-section">
                <h4>Select Flavors ({selectedBilaoFlavors.length}/{selectedBilaoItem.variants.find(v => v.label === (selectedVariants[selectedBilaoItem.id] || selectedBilaoItem.variants[0].label))?.maxFlavors || 4})</h4>
                <div className="flavors-grid">
                  {CHICKEN_WING_FLAVORS.map(flavor => (
                    <label key={flavor} className="flavor-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedBilaoFlavors.includes(flavor)}
                        onChange={() => handleBilaoFlavorToggle(flavor)}
                      />
                      <span>{flavor}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-primary"
                onClick={handleBilaoAddToCart}
                disabled={addingItem === selectedBilaoItem.id}
              >
                {addingItem === selectedBilaoItem.id ? 'Adding…' : 'Add to Cart'}
              </button>
              <button className="btn btn-secondary" onClick={closeBilaoModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {!user && (
        <div className="login-prompt-nook">
          Please log in to add items to the cart.
        </div>
      )}
    </div>
  );
};

export default Menu;
