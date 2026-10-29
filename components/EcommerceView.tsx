import React, { useState, useEffect } from 'react';
import { User, Language, HealthProfile, Product, CartItem } from '../types';
import { translations } from '../i18n';
import {
  loadPlatformState,
  subscribePlatformState,
  registerMarketplaceStore,
} from '../services/platformHubService';

interface Props {
  user: User | null;
  profile: HealthProfile | null;
  lang: Language;
  darkMode?: boolean;
  onUpdateUser: (user: User) => void;
}

const getInitialProducts = (lang: Language): Product[] => {
    const isBn = lang === 'bn';
    return [
      {
        id: 'p1',
        name: isBn ? 'অর্গানিক এ২ বৈদিক ঘি' : 'Organic A2 Vedic Ghee',
        sellerName: 'Dhaka Ayurvedic Labs',
        price: 1250,
        image: '🍯',
        category: 'Oils',
        description: isBn ? 'ধীরে রান্না করা ঐতিহ্যবাহী বিলোনা ঘি। অন্ত্রের স্বাস্থ্যের জন্য বুটাইরিক অ্যাসিড সমৃদ্ধ।' : 'Slow-cooked traditional bilona ghee. High in butyric acid for gut health.',
        doshaSuitability: ['Vata', 'Pitta'],
        rating: 4.8,
        reviews: [
          { id: 'r1', userName: 'Anisur R.', rating: 5, comment: isBn ? 'খাঁটি স্বাদ!' : 'Authentic taste!', date: '2023-11-10' }
        ]
      },
      {
        id: 'p2',
        name: isBn ? 'মিলেট-গাট রিস্টোর মিক্স' : 'Millet-Gut Restore Mix',
        sellerName: 'Nature-Bio Foods',
        price: 450,
        image: '🌾',
        category: 'Grains',
        description: isBn ? 'মাইক্রোবায়োম স্থিতিশীলতার জন্য গাঁজানো মিলেট স্প্রাউট আটা।' : 'Fermented millet sprout flour for microbiome stability.',
        doshaSuitability: ['Kapha', 'Vata'],
        rating: 4.5,
        reviews: []
      },
      {
        id: 'p3',
        name: isBn ? 'কাঁচা মধু - সুন্দরবন' : 'Raw Honey - Sundarban',
        sellerName: 'Village Coop',
        price: 850,
        image: '🐝',
        category: 'Supplements',
        description: isBn ? 'অপরিশোধিত বন্য মধু। ইনসুলিন ভারসাম্যের জন্য চমৎকার (পরিমিত)।' : 'Unfiltered wild honey. Excellent for insulin balance (moderation).',
        doshaSuitability: ['Kapha', 'Pitta'],
        rating: 4.9,
        reviews: []
      }
    ];
};

const EcommerceView: React.FC<Props> = ({ user, profile, lang, darkMode, onUpdateUser }) => {
  const t = translations[lang];
  const isBn = lang === 'bn';
  const [hubState, setHubState] = useState(() => loadPlatformState());

  useEffect(() => {
    return subscribePlatformState((st) => setHubState(st));
  }, []);

  // Strict Role Selection: Only Businessman or Consumer
  const [marketRole, setMarketRole] = useState<'businessman' | 'consumer' | null>(() => {
    if (user?.isSeller) return 'businessman';
    return null;
  });
  
  const [activeTab, setActiveTab] = useState<'browse' | 'cart' | 'seller'>('browse');
  const [products, setProducts] = useState<Product[]>(getInitialProducts(lang));
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isRegisteringSeller, setIsRegisteringSeller] = useState(false);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [checkoutData, setCheckoutData] = useState({ name: '', address: '', phone: '', email: '' });
  const [orderComplete, setOrderComplete] = useState(false);
  const [storeNotice, setStoreNotice] = useState<string | null>(null);

  // Store Registration Form State
  const [storeForm, setStoreForm] = useState({
    storeName: '',
    ownerName: user?.name || '',
    ownerPhone: '',
    ownerEmail: user?.email || '',
    licenseNumber: '',
    location: 'ঢাকা, বাংলাদেশ',
    categoryFocus: 'Oils & Organic Grains',
    description: '',
  });

  // Add Product State (Seller Only)
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    price: '',
    category: 'Oils',
    description: ''
  });

  const myStoreApplication = hubState.stores.find(
    (s) =>
      (user?.id && s.ownerUserId === user.id) ||
      (storeForm.ownerEmail && s.ownerEmail.toLowerCase() === storeForm.ownerEmail.toLowerCase())
  );
  const isMyStoreApproved = Boolean(user?.isSeller || myStoreApplication?.status === 'approved');

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.product.id !== id));
  };

  const cartTotal = cart.reduce((acc, curr) => acc + (curr.product.price * curr.quantity), 0);

  const handleSellerRegister = () => {
    if (!storeForm.storeName.trim() || !storeForm.licenseNumber.trim() || !storeForm.ownerEmail.trim()) {
      setStoreNotice(
        isBn
          ? 'অনুগ্রহ করে দোকানের নাম, ট্রেড লাইসেন্স নম্বর এবং ইমেইল পূরণ করুন।'
          : 'Please fill in Store Name, License Number, and Email.'
      );
      return;
    }
    setIsRegisteringSeller(true);
    registerMarketplaceStore({
      ownerUserId: user?.id || `SELLER-${Math.floor(1000 + Math.random() * 9000)}`,
      ownerName: storeForm.ownerName.trim() || user?.name || 'Store Owner',
      ownerEmail: storeForm.ownerEmail.trim(),
      ownerPhone: storeForm.ownerPhone.trim() || '01700-000000',
      storeName: storeForm.storeName.trim(),
      licenseNumber: storeForm.licenseNumber.trim(),
      location: storeForm.location.trim(),
      categoryFocus: storeForm.categoryFocus,
      description:
        storeForm.description.trim() ||
        (isBn ? 'ক্লিনিক্যালি পরীক্ষিত অর্গানিক ফুড স্টোর।' : 'Clinically verified organic food store.'),
    });
    setIsRegisteringSeller(false);
    setStoreNotice(
      isBn
        ? '✅ আপনার দোকান রেজিস্ট্রেশন আবেদনটি অ্যাডমিন প্যানেলে পাঠানো হয়েছে! অ্যাডমিন যাচাই করে অ্যাপ্রুভ করলেই আপনার স্টোর চালু হবে।'
        : '✅ Your store registration has been sent to the Admin Panel! Once approved by Admin, your store will go live.'
    );
  };

  const handleAddProduct = () => {
    if (!newProductForm.name || !newProductForm.price) return;

    const newProd: Product = {
      id: `p-${Date.now()}`,
      name: newProductForm.name,
      sellerName: myStoreApplication?.storeName || user?.name || "My Institution",
      price: parseFloat(newProductForm.price),
      image: newProductForm.category === 'Oils' ? '🫗' : newProductForm.category === 'Grains' ? '🌾' : newProductForm.category === 'Tea' ? '🍵' : '📦',
      category: newProductForm.category as any,
      description: newProductForm.description || "Premium quality product.",
      doshaSuitability: ['Tridoshic'],
      rating: 5.0,
      reviews: []
    };

    setProducts([newProd, ...products]);
    setIsAddingProduct(false);
    setNewProductForm({ name: '', price: '', category: 'Oils', description: '' });
    setStoreNotice(isBn ? '✅ পণ্যটি সফলভাবে মার্কেটপ্লেসে যুক্ত হয়েছে!' : t.product_added);
  };

  const handlePlaceOrder = () => {
    setOrderComplete(true);
    setCart([]);
    setTimeout(() => {
        setOrderComplete(false);
        setShowCheckoutForm(false);
        setActiveTab('browse');
    }, 3000);
  };

  // 1. ENTRY SCREEN: STRICTLY BUSINESSMAN vs CONSUMER (No Doctor/Self/Referred)
  if (!marketRole) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 animate-in zoom-in duration-500">
        <div className="text-center mb-12">
           <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-5xl mb-6 shadow-xl ${darkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}>
             🏪
           </div>
           <h2 className={`text-4xl font-bold serif italic mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.market_selection_title}</h2>
           <p className="opacity-60">{t.market_selection_subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Option A: Businessman */}
           <button 
             onClick={() => setMarketRole('businessman')}
             className={`p-12 rounded-[40px] border-4 border-dashed transition-all hover:scale-105 active:scale-95 flex flex-col items-center gap-6 ${darkMode ? 'bg-blue-500/10 border-blue-500/30 hover:border-blue-500' : 'bg-blue-50 border-blue-200 hover:border-blue-500 shadow-xl'}`}
           >
              <div className="w-24 h-24 rounded-3xl bg-blue-600 text-white flex items-center justify-center text-5xl shadow-2xl">🏢</div>
              <div className="text-center">
                 <h3 className={`text-2xl font-bold serif italic mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-800'}`}>{t.i_am_businessman}</h3>
                 <p className="text-xs font-black uppercase tracking-widest opacity-60">Register institution to sell bio-compliant food</p>
              </div>
           </button>

           {/* Option B: Consumer */}
           <button 
             onClick={() => setMarketRole('consumer')}
             className={`p-12 rounded-[40px] border-4 border-dashed transition-all hover:scale-105 active:scale-95 flex flex-col items-center gap-6 ${darkMode ? 'bg-orange-500/10 border-orange-500/30 hover:border-orange-500' : 'bg-orange-50 border-orange-200 hover:border-orange-500 shadow-xl'}`}
           >
              <div className="w-24 h-24 rounded-3xl bg-orange-500 text-white flex items-center justify-center text-5xl shadow-2xl">🛍️</div>
              <div className="text-center">
                 <h3 className={`text-2xl font-bold serif italic mb-2 ${darkMode ? 'text-orange-600' : 'text-orange-800'}`}>{t.i_am_consumer}</h3>
                 <p className="text-xs font-black uppercase tracking-widest opacity-60">Browse & Shop as a Guest or Patient</p>
              </div>
           </button>
        </div>
      </div>
    );
  }

  // 2. MAIN MARKETPLACE UI
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-32 px-4">
      {/* Marketplace Nav Header */}
      <div className={`p-6 md:p-8 rounded-[40px] border shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-2xl md:text-3xl shadow-lg ${marketRole === 'businessman' ? 'bg-blue-600' : 'bg-orange-500'} text-white`}>
            {marketRole === 'businessman' ? '🏢' : '🛒'}
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold serif italic leading-tight">{t.marketplace_title}</h2>
            <p className="text-xs opacity-60 max-w-sm">{t.marketplace_subtitle}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-center gap-2">
            <button onClick={() => setMarketRole(null)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-inherit opacity-40 hover:opacity-100 transition-opacity`}>Switch Mode</button>
            <button onClick={() => setActiveTab('browse')} className={`px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'browse' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>Browse</button>
            <button onClick={() => setActiveTab('cart')} className={`px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all relative ${activeTab === 'cart' ? 'bg-orange-500 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
              Cart ({cart.length})
              {cart.length > 0 && <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">!</span>}
            </button>
            <button onClick={() => setActiveTab('seller')} className={`px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'seller' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
              {isMyStoreApproved ? (isBn ? 'আমার দোকান ড্যাশবোর্ড' : 'Store Dashboard') : (isBn ? '🏪 দোকান চালু করুন (রেজিস্ট্রেশন)' : '🏪 Open Your Store')}
            </button>
        </div>
      </div>

      {storeNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between">
          <span>{storeNotice}</span>
          <button onClick={() => setStoreNotice(null)}>✕</button>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'browse' && (
        <div className="space-y-10">
          {/* Verified Stores Approved by Admin */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider opacity-70">
                {isBn ? '🏪 অ্যাডমিন অনুমোদিত অর্গানিক স্টোরসমূহ' : '🏪 Admin-Verified Organic Partner Stores'}
              </h3>
              <button
                onClick={() => setActiveTab('seller')}
                className="text-xs font-extrabold text-blue-600 dark:text-blue-400 underline"
              >
                {isBn ? '+ আপনার নিজের দোকান চালু করার আবেদন করুন' : '+ Register Your Own Store'}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {hubState.stores
                .filter((s) => s.status === 'approved')
                .map((st) => (
                  <div
                    key={st.id}
                    className={`p-4 rounded-2xl border flex items-start gap-3 ${
                      darkMode ? 'bg-slate-900 border-emerald-500/30' : 'bg-emerald-50/50 border-emerald-200'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg shrink-0">
                      🏪
                    </div>
                    <div className="text-xs space-y-0.5">
                      <div className="font-extrabold">{st.storeName}</div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        ✓ Admin Approved • {st.location}
                      </div>
                      <p className="text-[11px] opacity-75 line-clamp-2">{st.description}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
             {['All', 'Oils', 'Grains', 'Tea', 'Superfoods'].map(cat => (
               <button key={cat} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${darkMode ? 'border-slate-800 bg-slate-900 text-slate-400' : 'border-slate-200 bg-white hover:border-orange-400 text-slate-600'}`}>
                 {cat}
               </button>
             ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {products.map(product => (
              <div key={product.id} className={`p-6 rounded-[32px] border group transition-all hover:translate-y-[-4px] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm hover:shadow-xl'}`}>
                <div 
                    className="aspect-square rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-7xl mb-6 shadow-inner transition-transform group-hover:scale-105 cursor-pointer"
                    onClick={() => setSelectedProduct(product)}
                >
                   {product.image}
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-bold text-lg leading-tight hover:text-orange-500 cursor-pointer" onClick={() => setSelectedProduct(product)}>{product.name}</h3>
                    <span className="font-black text-orange-500 whitespace-nowrap">৳{product.price}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex text-amber-400 text-xs">{'★'.repeat(Math.floor(product.rating))}</div>
                    <span className="text-[10px] opacity-40 font-bold">({product.rating})</span>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full inline-block">{product.sellerName}</p>
                  <p className="text-xs opacity-60 line-clamp-2 italic leading-relaxed">{product.description}</p>
                  
                  <div className="flex gap-2 pt-4">
                    <button 
                      onClick={() => addToCart(product)}
                      className="flex-1 py-3 rounded-xl bg-slate-900 dark:bg-orange-500 hover:bg-slate-800 dark:hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                    >
                      {t.add_to_cart}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'cart' && (
        <div className={`p-6 md:p-10 rounded-[40px] border animate-in slide-in-from-right duration-500 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl'}`}>
          <h3 className="text-2xl font-bold serif italic mb-8 underline decoration-orange-500 decoration-4">{t.cart_title}</h3>
          
          {orderComplete ? (
             <div className="py-20 text-center space-y-4">
                <span className="text-6xl animate-bounce block">✅</span>
                <h4 className="text-2xl font-bold serif italic">{t.order_success}</h4>
                <p className="opacity-60 text-sm">Your order has been sent to the institution.</p>
             </div>
          ) : cart.length === 0 ? (
            <div className="py-20 text-center space-y-4 opacity-50">
               <span className="text-6xl">🛒</span>
               <p className="font-bold uppercase tracking-widest text-xs">{t.cart_empty}</p>
               <button onClick={() => setActiveTab('browse')} className="text-orange-500 underline text-xs font-black">Continue Shopping</button>
            </div>
          ) : !showCheckoutForm ? (
            <div className="space-y-6">
               {cart.map(item => (
                 <div key={item.product.id} className="flex items-center justify-between border-b pb-6 border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-6">
                       <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-3xl">{item.product.image}</div>
                       <div>
                          <h4 className="font-bold text-sm">{item.product.name}</h4>
                          <p className="text-[10px] opacity-50">Qty: {item.quantity} × ৳{item.product.price}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-6">
                       <span className="font-black text-sm">৳{item.product.price * item.quantity}</span>
                       <button onClick={() => removeFromCart(item.product.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg">✕</button>
                    </div>
                 </div>
               ))}

               <div className="pt-8 flex flex-col items-end gap-6">
                  <div className="text-right">
                    <span className="text-xs opacity-50 uppercase font-black mr-4">{t.total}</span>
                    <span className="text-3xl font-black text-orange-500">৳{cartTotal}</span>
                  </div>
                  <button 
                    onClick={() => setShowCheckoutForm(true)}
                    className="w-full md:w-auto px-12 py-5 rounded-[30px] bg-slate-900 text-white font-black uppercase tracking-widest text-sm shadow-2xl hover:scale-105 active:scale-95 transition-all"
                  >
                     🚀 {t.checkout}
                  </button>
               </div>
            </div>
          ) : (
             /* Consumer Guest Checkout Form */
             <div className="max-w-md mx-auto space-y-8 animate-in slide-in-from-bottom duration-500">
                <div className="text-center">
                   <h3 className="text-2xl font-bold serif italic mb-2">{t.checkout_form_title}</h3>
                   <p className="text-xs opacity-60 italic">Guest Checkout - No Account Required</p>
                </div>
                
                <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase opacity-40 px-2">{t.cust_name}</label>
                      <input 
                        type="text" 
                        value={checkoutData.name}
                        onChange={e => setCheckoutData({...checkoutData, name: e.target.value})}
                        className={`w-full p-4 rounded-xl border-2 outline-none focus:border-orange-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`} 
                        placeholder="e.g. Arif Hossain"
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase opacity-40 px-2">{t.cust_address}</label>
                      <textarea 
                        rows={3}
                        value={checkoutData.address}
                        onChange={e => setCheckoutData({...checkoutData, address: e.target.value})}
                        className={`w-full p-4 rounded-xl border-2 outline-none focus:border-orange-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`} 
                        placeholder="House/Apt, Road, City"
                      />
                   </div>
                   <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1">
                         <label className="text-[10px] font-black uppercase opacity-40 px-2">{t.cust_phone}</label>
                         <input 
                           type="tel" 
                           value={checkoutData.phone}
                           onChange={e => setCheckoutData({...checkoutData, phone: e.target.value})}
                           className={`w-full p-4 rounded-xl border-2 outline-none focus:border-orange-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`} 
                           placeholder="017XXXXXXXX"
                         />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-black uppercase opacity-40 px-2">{t.cust_email}</label>
                         <input 
                           type="email" 
                           value={checkoutData.email}
                           onChange={e => setCheckoutData({...checkoutData, email: e.target.value})}
                           className={`w-full p-4 rounded-xl border-2 outline-none focus:border-orange-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`} 
                           placeholder="your@email.com"
                         />
                      </div>
                   </div>
                </div>

                <button 
                  onClick={handlePlaceOrder}
                  disabled={!checkoutData.name || !checkoutData.phone || !checkoutData.address}
                  className="w-full py-5 rounded-[30px] bg-emerald-600 text-white font-black uppercase tracking-widest text-sm shadow-xl hover:bg-emerald-500 active:scale-95 transition-all disabled:opacity-50"
                >
                  {t.place_order}
                </button>
                <button onClick={() => setShowCheckoutForm(false)} className="w-full text-center text-xs font-bold opacity-40 uppercase hover:opacity-100">{t.back}</button>
             </div>
          )}
        </div>
      )}

      {/* Businessman Path: Store Registration (Sent to Admin Panel) */}
      {activeTab === 'seller' && !isMyStoreApproved && (
        <div className={`p-8 md:p-12 rounded-[40px] border shadow-2xl text-center space-y-8 animate-in zoom-in duration-500 ${darkMode ? 'bg-slate-900 border-blue-500/30' : 'bg-white border-blue-100'}`}>
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-full mx-auto flex items-center justify-center text-4xl shadow-lg">🏪</div>
          <div className="max-w-lg mx-auto space-y-3">
            <h3 className="text-2xl md:text-3xl font-bold serif italic">
              {isBn ? 'মার্কেটপ্লেসে আপনার দোকান চালু করুন' : t.seller_reg}
            </h3>
            <p className="text-xs md:text-sm opacity-70">
              {isBn
                ? 'নিচের ফর্মটি পূরণ করে জমা দিলে তা অ্যাডমিন প্যানেলে নোটিফিকেশন হিসেবে যাবে। অ্যাডমিন প্যানেল যাচাই করে অ্যাপ্রুভ করলেই আপনার দোকান চালু হয়ে যাবে।'
                : 'Submit your store registration below. Admin Panel will receive a notification and approve your shop.'}
            </p>
          </div>

          {myStoreApplication && myStoreApplication.status === 'pending' ? (
            <div className="max-w-md mx-auto p-6 rounded-3xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-600 dark:text-amber-300 space-y-2">
              <div className="text-2xl">⏳</div>
              <h4 className="font-extrabold text-sm">
                {isBn
                  ? `আপনার "${myStoreApplication.storeName}" দোকানের আবেদন অ্যাডমিন প্যানেলে অপেক্ষমাণ আছে`
                  : `Your store "${myStoreApplication.storeName}" is Pending Admin Approval`}
              </h4>
              <p className="text-xs opacity-80">
                {isBn
                  ? 'অ্যাডমিন প্যানেল থেকে অ্যাপ্রুভ করার সাথে সাথেই আপনি এখানে পণ্য যুক্ত করতে পারবেন।'
                  : 'Once approved in the Admin Panel, your seller dashboard will unlock automatically.'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase opacity-60 px-2">
                    {isBn ? 'দোকান / প্রতিষ্ঠানের নাম *' : t.institution_name}
                  </label>
                  <input
                    type="text"
                    value={storeForm.storeName}
                    onChange={(e) => setStoreForm({ ...storeForm, storeName: e.target.value })}
                    placeholder={isBn ? 'যেমন: গ্রিন হারভেস্ট অর্গানিক ফুডস' : 'e.g. Pure-Ayur Labs'}
                    className={`w-full p-3.5 rounded-xl border-2 text-xs outline-none focus:border-blue-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase opacity-60 px-2">
                    {isBn ? 'মালিকের নাম *' : 'Owner Name *'}
                  </label>
                  <input
                    type="text"
                    value={storeForm.ownerName}
                    onChange={(e) => setStoreForm({ ...storeForm, ownerName: e.target.value })}
                    placeholder={isBn ? 'আপনার নাম' : 'Your Full Name'}
                    className={`w-full p-3.5 rounded-xl border-2 text-xs outline-none focus:border-blue-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase opacity-60 px-2">
                    {isBn ? 'ট্রেড লাইসেন্স / এনআইডি নম্বর *' : t.license_no}
                  </label>
                  <input
                    type="text"
                    value={storeForm.licenseNumber}
                    onChange={(e) => setStoreForm({ ...storeForm, licenseNumber: e.target.value })}
                    placeholder="Trade-Lic-123456"
                    className={`w-full p-3.5 rounded-xl border-2 text-xs outline-none focus:border-blue-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase opacity-60 px-2">
                    {isBn ? 'মোবাইল নম্বর *' : 'Mobile Number *'}
                  </label>
                  <input
                    type="text"
                    value={storeForm.ownerPhone}
                    onChange={(e) => setStoreForm({ ...storeForm, ownerPhone: e.target.value })}
                    placeholder="017XXXXXXXX"
                    className={`w-full p-3.5 rounded-xl border-2 text-xs outline-none focus:border-blue-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase opacity-60 px-2">
                    {isBn ? 'ইমেইল *' : t.contact_email}
                  </label>
                  <input
                    type="email"
                    value={storeForm.ownerEmail}
                    onChange={(e) => setStoreForm({ ...storeForm, ownerEmail: e.target.value })}
                    placeholder="store@example.com"
                    className={`w-full p-3.5 rounded-xl border-2 text-xs outline-none focus:border-blue-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase opacity-60 px-2">
                    {isBn ? 'ঠিকানা / শহর' : 'Location / City'}
                  </label>
                  <input
                    type="text"
                    value={storeForm.location}
                    onChange={(e) => setStoreForm({ ...storeForm, location: e.target.value })}
                    className={`w-full p-3.5 rounded-xl border-2 text-xs outline-none focus:border-blue-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-black uppercase opacity-60 px-2">
                    {isBn ? 'পণ্যের বিবরণ (কী ধরনের অর্গানিক পণ্য বিক্রি করবেন)' : 'Store & Product Description'}
                  </label>
                  <textarea
                    rows={2}
                    value={storeForm.description}
                    onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })}
                    placeholder={isBn ? 'যেমন: লাল চাল, ঘানির সরিষার তেল, অর্গানিক চিয়া সিড...' : 'Describe your organic products...'}
                    className={`w-full p-3.5 rounded-xl border-2 text-xs outline-none focus:border-blue-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`}
                  />
                </div>
              </div>

              <button
                onClick={handleSellerRegister}
                disabled={isRegisteringSeller}
                className="px-10 py-4 rounded-[28px] bg-blue-600 text-white font-black uppercase tracking-widest text-xs shadow-xl hover:bg-blue-500 transition-all disabled:opacity-50"
              >
                {isRegisteringSeller
                  ? isBn
                    ? 'পাঠানো হচ্ছে...'
                    : 'Submitting...'
                  : isBn
                  ? 'অ্যাডমিন অনুমোদনের জন্য জমা দিন'
                  : 'Submit Store for Admin Approval'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Businessman Path: Dashboard & Add Product */}
      {activeTab === 'seller' && isMyStoreApproved && (
        <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
           {!isAddingProduct ? (
             <>
               <div className={`p-8 rounded-[40px] border flex justify-between items-center ${darkMode ? 'bg-emerald-900/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'}`}>
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-xl shadow-lg">📊</div>
                     <div>
                        <h3 className="text-xl font-bold serif italic text-emerald-800 dark:text-emerald-400">{t.seller_title}</h3>
                        <p className="text-xs font-black uppercase tracking-widest opacity-60">Verified Seller: {user.name}</p>
                     </div>
                  </div>
                  <button onClick={() => setIsAddingProduct(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:scale-105 active:scale-95 transition-all">
                    + {t.add_product_title}
                  </button>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { label: t.active_items, val: products.filter(p => p.sellerName === user.name || p.sellerName === 'My Institution').length.toString(), color: 'text-blue-500' },
                    { label: t.units_sold, val: '89', color: 'text-emerald-500' },
                    { label: t.revenue, val: '৳48,600', color: 'text-orange-500' },
                    { label: t.inst_trust, val: 'A+', color: 'text-purple-500' }
                  ].map(stat => (
                    <div key={stat.label} className={`p-6 rounded-[32px] border text-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                       <span className="text-[10px] font-black uppercase opacity-40 mb-1 block">{stat.label}</span>
                       <span className={`text-2xl font-black ${stat.color}`}>{stat.val}</span>
                    </div>
                  ))}
               </div>
               
               <h3 className="text-lg font-bold serif italic mt-8">{t.my_listed_products}</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.filter(p => p.sellerName === user.name || p.sellerName === "My Institution").length > 0 ? (
                    products.filter(p => p.sellerName === user.name || p.sellerName === "My Institution").map(p => (
                      <div key={p.id} className={`p-4 rounded-2xl border flex items-center gap-4 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                         <div className="text-2xl">{p.image}</div>
                         <div>
                            <div className="font-bold text-sm">{p.name}</div>
                            <div className="text-xs opacity-60">৳{p.price} • {p.category}</div>
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className={`p-10 rounded-[30px] border border-dashed text-center opacity-40 col-span-2 ${darkMode ? 'border-slate-700' : 'border-slate-300'}`}>
                       <p className="font-bold italic">{t.no_products_listed}</p>
                    </div>
                  )}
               </div>
             </>
           ) : (
             /* Add Product Form */
             <div className={`max-w-xl mx-auto p-10 rounded-[40px] border shadow-2xl animate-in slide-in-from-right duration-500 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <h3 className="text-2xl font-bold serif italic mb-6 text-center">{t.add_product_title}</h3>
                
                <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase opacity-40 px-2">{t.prod_name}</label>
                      <input 
                        type="text" 
                        value={newProductForm.name}
                        onChange={e => setNewProductForm({...newProductForm, name: e.target.value})}
                        className={`w-full p-4 rounded-xl border-2 outline-none focus:border-blue-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`} 
                      />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                         <label className="text-[10px] font-black uppercase opacity-40 px-2">{t.prod_category}</label>
                         <select 
                           value={newProductForm.category}
                           onChange={e => setNewProductForm({...newProductForm, category: e.target.value})}
                           className={`w-full p-4 rounded-xl border-2 outline-none focus:border-blue-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`}
                         >
                            <option value="Oils">Oils</option>
                            <option value="Grains">Grains</option>
                            <option value="Tea">Tea</option>
                            <option value="Supplements">Supplements</option>
                            <option value="Snacks">Snacks</option>
                         </select>
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-black uppercase opacity-40 px-2">{t.prod_price}</label>
                         <input 
                           type="number" 
                           value={newProductForm.price}
                           onChange={e => setNewProductForm({...newProductForm, price: e.target.value})}
                           className={`w-full p-4 rounded-xl border-2 outline-none focus:border-blue-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`} 
                         />
                      </div>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase opacity-40 px-2">{t.prod_desc}</label>
                      <textarea 
                        rows={3}
                        value={newProductForm.description}
                        onChange={e => setNewProductForm({...newProductForm, description: e.target.value})}
                        className={`w-full p-4 rounded-xl border-2 outline-none focus:border-blue-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`} 
                      />
                   </div>
                </div>

                <div className="flex gap-4 mt-8">
                   <button onClick={() => setIsAddingProduct(false)} className="flex-1 py-4 font-bold uppercase tracking-widest text-xs opacity-50 hover:opacity-100">{t.cancel}</button>
                   <button 
                     onClick={handleAddProduct}
                     disabled={!newProductForm.name || !newProductForm.price}
                     className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all disabled:opacity-50"
                   >
                     {t.save_product}
                   </button>
                </div>
             </div>
           )}
        </div>
      )}

      {/* Product Detail Modal (Consumer Browsing) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setSelectedProduct(null)} />
          <div className={`relative w-full max-w-4xl h-[90vh] md:h-[85vh] rounded-[48px] border flex flex-col md:flex-row overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'}`}>
            <div className="w-full md:w-1/2 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[8rem] md:text-[10rem]">
              {selectedProduct.image}
            </div>
            <div className="w-full md:w-1/2 p-8 md:p-10 overflow-y-auto space-y-8 scrollbar-hide">
               <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold serif italic leading-tight">{selectedProduct.name}</h2>
                    <div className="flex items-center gap-4 mt-2">
                       <p className="text-sm font-black text-orange-500 uppercase tracking-widest">{selectedProduct.category}</p>
                       <span className="w-1 h-1 rounded-full bg-slate-300" />
                       <span className="text-xs font-bold opacity-40">{selectedProduct.sellerName}</span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedProduct(null)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">✕</button>
               </div>

               <div className="flex items-center gap-4">
                 <span className="text-3xl font-black text-orange-500">৳{selectedProduct.price}</span>
                 <div className="flex flex-col">
                    <div className="flex text-amber-400">{'★'.repeat(5)}</div>
                    <span className="text-[10px] opacity-50 font-bold uppercase tracking-widest">{t.market_rating}</span>
                 </div>
               </div>

               <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40">{t.product_overview}</h4>
                  <p className="text-sm leading-relaxed italic">{selectedProduct.description}</p>
               </div>

               <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40">{t.dosha_suitable}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.doshaSuitability.map(d => (
                      <span key={d} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>{d}</span>
                    ))}
                  </div>
               </div>

               <div className="space-y-6 pt-4">
                  <h4 className="text-lg font-bold serif italic border-b pb-2">{t.reviews}</h4>
                  {selectedProduct.reviews.length === 0 ? (
                    <p className="text-xs opacity-40 italic">Be the first consumer to review this verified product.</p>
                  ) : (
                    <div className="space-y-4">
                      {selectedProduct.reviews.map(rev => (
                        <div key={rev.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-orange-500/20 transition-all">
                           <div className="flex justify-between mb-1">
                              <span className="font-bold text-xs">{rev.userName}</span>
                              <span className="text-[10px] opacity-40">{rev.date}</span>
                           </div>
                           <div className="text-orange-500 text-[10px] mb-2">{'★'.repeat(rev.rating)}</div>
                           <p className="text-xs leading-relaxed italic">"{rev.comment}"</p>
                        </div>
                      ))}
                    </div>
                  )}
               </div>

               <div className="sticky bottom-0 pt-8 pb-4 bg-inherit border-t transition-colors dark:border-slate-800 border-slate-100 flex gap-4">
                  <button onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }} className="flex-1 py-5 rounded-[24px] bg-orange-500 text-white font-black uppercase tracking-widest text-xs shadow-xl transition-all active:scale-95">
                     {t.add_to_cart}
                  </button>
                  <button 
                    onClick={() => { addToCart(selectedProduct); setActiveTab('cart'); setSelectedProduct(null); }}
                    className="flex-1 py-5 rounded-[24px] bg-slate-900 text-white font-black uppercase tracking-widest text-xs shadow-xl transition-all active:scale-95"
                  >
                     {t.buy_now}
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EcommerceView;
