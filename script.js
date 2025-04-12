const firebaseConfig = {
    apiKey: "AIzaSyA16M_6xOrUGEn9YCdzIFxBYXr-9ST7IWY",
    authDomain: "qrmenuapplication-9b920.firebaseapp.com",
    databaseURL: "https://qrmenuapplication-9b920-default-rtdb.firebaseio.com",
    projectId: "qrmenuapplication-9b920",
    storageBucket: "qrmenuapplication-9b920.appspot.com",
    messagingSenderId: "1050979828232",
    appId: "1:1050979828232:web:54d81e21056193bee147bd",
    measurementId: "G-C3S611TREX"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();



let selectedLanguage = 'tr'; // Varsayılan dil
window.allProducts = []; // Global ürün dizisini tanımlıyoruz

function setLanguage(lang) {
    selectedLanguage = lang;
    localStorage.setItem('selectedLanguage', lang);
    fetchMenuItems();
    loadHeaderText();
}

// Sayfa yüklendiğinde seçili dili kontrol et
document.addEventListener('DOMContentLoaded', () => {
    const lang = localStorage.getItem('selectedLanguage');
    if (lang) {
        selectedLanguage = lang;
    }
    setLanguage(selectedLanguage);
});

// Menü öğelerini Firebase'den çekip kategoriye göre ayırma
async function fetchMenuItems() {
    const menuContent = document.getElementById('menuContent');
    menuContent.innerHTML = ''; // Mevcut içeriği temizle
    const categories = {};

    try {
        // Kategorileri ve ürünleri paralel olarak çekme
        const [catSnapshot, productSnapshot] = await Promise.all([
            database.ref('Categories4').orderByChild('order').once('value'),
            database.ref('Products4').once('value')
        ]);

        const categoryData = catSnapshot.val() || {};
        const productsData = productSnapshot.val() || {};

        // Kategorileri ve ürünleri işleme
        for (let productId in productsData) {
            const product = productsData[productId];
            if (product && product.categoryId) {
                const categoryId = product.categoryId;
                // Kategori verisini kontrol et
                const categoryInfo = categoryData[categoryId];
                if (!categoryInfo) {
                    console.warn(`Kategori bulunamadı: ${categoryId}`);
                    continue; // Bu ürün için devam et
                }
                if (!categories[categoryId]) {
                    categories[categoryId] = {
                        info: {
                            ...categoryInfo,
                            id: categoryId
                        },
                        products: []
                    };
                }
                categories[categoryId].products.push(product);
            }
        }

        // Kategorileri 'order' değerine göre sıralamak için Object.values kullanıyoruz
        const sortedCategories = Object.values(categories).sort((a, b) => {
            const orderA = a.info.order || 0;
            const orderB = b.info.order || 0;
            return orderA - orderB;
        });

        // Kategorileri ve ürünleri oluşturma
        for (let category of sortedCategories) {
            const categoryInfo = category.info;
            const categoryProducts = category.products;

            // Kategori ismini ve resmini seçili dile göre al
            const categoryName = categoryInfo['name_' + selectedLanguage] || categoryInfo['name_tr'] || 'Kategori İsmi';
            const categoryImageUrl = categoryInfo.imageUrl || '';

            // Kategori bölümü oluşturma
            const categoryDiv = document.createElement('div');
            categoryDiv.classList.add('category-container');

            const categoryTitleDiv = document.createElement('div');
            categoryTitleDiv.classList.add('category');

            // Kategori başlığına arka plan resmi ekleme
            categoryTitleDiv.style.backgroundImage = `url(${categoryImageUrl})`;

            const categoryTitle = document.createElement('h2');
            categoryTitle.textContent = categoryName;

            categoryTitleDiv.addEventListener('click', () => {
                toggleMenu(categoryInfo.id);
            });

            categoryTitleDiv.appendChild(categoryTitle);

            const menuItemsDiv = document.createElement('div');
            menuItemsDiv.classList.add('menu-items');
            menuItemsDiv.id = categoryInfo.id;

            categoryProducts.forEach(product => {
                const menuItemDiv = document.createElement('div');
                menuItemDiv.classList.add('menu-item');

                // Ürün isimlerini ve açıklamalarını seçili dile göre al
                const productName = product['name_' + selectedLanguage] || product['name_tr'] || 'Ürün İsmi';
                const productDescription = product['description_' + selectedLanguage] || product['description_tr'] || '';

                // Resim öğesini oluşturma
                const img = document.createElement('img');
                img.src = product.imageUrl || '';
                img.alt = productName;

                // Resim yüklendiğinde filtreyi kaldır
                img.onload = () => {
                    img.style.filter = 'blur(0)';
                };

                // Resmi bulanık göstererek yüklenirken kullanıcı deneyimini iyileştirme
                img.style.filter = 'blur(10px)';

                img.addEventListener('click', () => {
                    openImageModal(product.imageUrl, productName);
                });

                const itemInfoDiv = document.createElement('div');
                itemInfoDiv.classList.add('item-info');

                const h3 = document.createElement('h3');
                h3.textContent = productName;

                const p = document.createElement('p');
                p.textContent = productDescription;

                itemInfoDiv.appendChild(h3);
                itemInfoDiv.appendChild(p);

                const priceSpan = document.createElement('span');
                priceSpan.classList.add('price');
                priceSpan.textContent = `₺${product.price}`;

                menuItemDiv.appendChild(img);
                menuItemDiv.appendChild(itemInfoDiv);
                menuItemDiv.appendChild(priceSpan);

                menuItemsDiv.appendChild(menuItemDiv);
            });

            categoryDiv.appendChild(categoryTitleDiv);
            categoryDiv.appendChild(menuItemsDiv);
            menuContent.appendChild(categoryDiv);
        }

    } catch (error) {
        console.error('Veriler alınırken hata oluştu:', error);
    }
}


// Menü öğesini aç/kapat
function toggleMenu(categoryId) {
    const menu = document.getElementById(categoryId);
    if (menu.style.display === "block") {
        menu.style.display = "none";
    } else {
        // Tüm açık menüleri kapat
        const allMenus = document.querySelectorAll('.menu-items');
        allMenus.forEach(m => {
            m.style.display = 'none';
        });

        menu.style.display = "block";
    }
}

// Başlık metinlerini yükle
function loadHeaderText() {
    const restaurantNameElem = document.getElementById('restaurantName');
    const restaurantTaglineElem = document.getElementById('restaurantTagline');

    const headerTextsRef = database.ref('Languages/headerTexts');
    headerTextsRef.once('value', (snapshot) => {
        const texts = snapshot.val();
        if (texts) {
            restaurantNameElem.textContent = texts['restaurantName_' + selectedLanguage] || texts['restaurantName_tr'];
            restaurantTaglineElem.textContent = texts['tagline_' + selectedLanguage] || texts['tagline_tr'];
        }
    });
}

// Ürün resmi modalını açma
function openImageModal(imageUrl, altText) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    modal.style.display = "block";
    modalImg.src = imageUrl;
    modalImg.alt = altText;
}

// Modalı kapatma
const modal = document.getElementById('imageModal');
const modalClose = document.getElementById('modalClose');

modalClose.onclick = function() {
    modal.style.display = "none";
};

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
};
window.addEventListener('scroll', function() {
    var header = document.getElementById('header');
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
  document.getElementById('searchButton').addEventListener('click', () => {
    console.log("Ara butonuna tıklandı");
    searchMenu();
  });
  
  document.getElementById('searchInput').addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
      console.log("Enter tuşuna basıldı");
      searchMenu();
    }
  });
  
  function searchMenu() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    console.log("Arama sorgusu:", query);
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = ''; // Önceki sonuçları temizle
  
    if (query === '') {
      console.log("Sorgu boş, arama yapılmadı.");
      return;
    }
  
    const matchingProducts = window.allProducts.filter(product => {
        // Örnek: 'name_tr' veya 'name' alanı kontrol ediliyor
        const name = ((product['name_' + selectedLanguage] || product.name || '')).toLowerCase();
        return name.includes(query);
      });
      
    console.log("Eşleşen ürünler:", matchingProducts);
  
    if (matchingProducts.length === 0) {
      resultsContainer.innerHTML = '<p>Aradığınız ürün bulunamadı.</p>';
    } else {
      matchingProducts.forEach(product => {
        const productName = product['name_' + selectedLanguage] || product['name_tr'] || 'Ürün İsmi';
        const productDescription = product['description_' + selectedLanguage] || product['description_tr'] || '';
        const menuItemDiv = document.createElement('div');
        menuItemDiv.classList.add('menu-item');
  
        const img = document.createElement('img');
        img.src = product.imageUrl || '';
        img.alt = productName;
        img.addEventListener('click', () => {
          openImageModal(product.imageUrl, productName);
        });
  
        const itemInfoDiv = document.createElement('div');
        itemInfoDiv.classList.add('item-info');
  
        const h3 = document.createElement('h3');
        h3.textContent = productName;
  
        const p = document.createElement('p');
        p.textContent = productDescription;
  
        itemInfoDiv.appendChild(h3);
        itemInfoDiv.appendChild(p);
  
        const priceSpan = document.createElement('span');
        priceSpan.classList.add('price');
        priceSpan.textContent = `₺${product.price}`;
  
        menuItemDiv.appendChild(img);
        menuItemDiv.appendChild(itemInfoDiv);
        menuItemDiv.appendChild(priceSpan);
  
        resultsContainer.appendChild(menuItemDiv);
      });
    }
  }
  