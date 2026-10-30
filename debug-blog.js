// Cole isso no console da aba /blog/ e aperte Enter
console.log('--- DEBUG BLOG ---');
console.log('localStorage admin_posts:', localStorage.getItem('admin_posts'));
var raw = localStorage.getItem('admin_posts');
if (raw) {
  var arr = JSON.parse(raw);
  console.log('posts encontrados no storage:', arr.length);
  arr.forEach(function(p) {
    console.log('id=', p.id || p.data?.id, 'title=', p.title || p.data?.title);
  });
  var grid = document.getElementById('blog-grid-root');
  if (grid) {
    arr.forEach(function(p) {
      if (!p) return;
      var pid = p.id || (p.data && p.data.id) || '';
      if (!pid) return;
      var art = document.createElement('article');
      art.className = 'bg-surface rounded-lg shadow-card border border-border overflow-hidden flex flex-col';
      art.innerHTML = '<h2><a href="/blog/' + pid + '/">' + (p.title || (p.data && p.data.title) || '') + '</a></h2>';
      grid.appendChild(art);
    });
    grid.setAttribute('data-admin-loaded', 'true');
    var msg = grid.querySelector('.msg-empty-blog');
    if (msg) msg.style.display = 'none';
    console.log('FORÇADO: inseridos ' + arr.length + ' posts');
  } else {
    console.log('ERRO: #blog-grid-root não encontrado');
  }
} else {
  console.log('ERRO: localStorage admin_posts está VAZIO');
}
