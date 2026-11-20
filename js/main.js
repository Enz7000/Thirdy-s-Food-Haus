document.addEventListener('DOMContentLoaded', () => {
  const featured = document.getElementById('featured');
  if (featured && typeof menuItems !== 'undefined') {
    menuItems.slice(0, 4).forEach(item => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <img src="${imgSrc(item.img)}" alt="${item.name}" onerror="this.onerror=null;this.src='${imgSrc('images/placeholder.svg')}'">
        <div class="card-body">
          <h3>${item.name}</h3>
          <p>${item.desc}</p>
          <div class="price">₱${item.price.toFixed(2)}</div>
        </div>
      `;
      featured.appendChild(card);
    });
  }
});