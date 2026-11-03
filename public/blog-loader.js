console.log('BLOG-LOADER EXECUTADO', document.querySelector('#blog-grid-root') ? 'grid ok' : 'grid faltante', localStorage.getItem('admin_posts') ? 'tem storage' : 'sem storage'); 
(function(){
  var siteBase=(document.body&&document.body.dataset.siteBase)||'/';
  function siteUrl(path){
    if(!path||/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(path)) return path;
    if(path===siteBase.slice(0,-1)||path.indexOf(siteBase)===0) return path;
    return siteBase+String(path).replace(/^\/+/, '');
  }
  function render(list){
    var grid=document.querySelector('#blog-grid-root');
    if(!grid)return;
    var existing=new Set(Array.from(grid.querySelectorAll('a[href^="/blog/"]')).map(function(a){return a.getAttribute('href').replace('/blog/','').replace('/','');}));
    list.forEach(function(p){
      if(!p)return;
      var pid=p.id||(p.data&&p.data.id)||'';
      if(existing.has(pid))return;
      var article=document.createElement('article');
      article.className='bg-surface rounded-lg shadow-card border border-border overflow-hidden flex flex-col';
      var imgWrap=document.createElement('div');
      imgWrap.className=(p.image||(p.data&&p.data.image))?'':'h-48 bg-surface-alt';
      if(p.image||(p.data&&p.data.image)){
        var img=document.createElement('img');
         img.src=siteUrl(p.image||(p.data&&p.data.image));
        img.alt=(p.title||(p.data&&p.data.title))||'';
        img.className='h-48 w-full object-cover bg-surface-alt';
        imgWrap.appendChild(img);
      }
      article.appendChild(imgWrap);
      var body=document.createElement('div');
      body.className='p-6 flex flex-col flex-1';
      var h2=document.createElement('h2');
      h2.className='font-display text-xl font-bold text-ink mb-2';
      var a=document.createElement('a');
       a.href=siteUrl('/blog/'+pid+'/');
      a.className='hover:underline decoration-accent-500 decoration-2 underline-offset-4';
      a.textContent=(p.title||(p.data&&p.data.title))||'';
      h2.appendChild(a);
      body.appendChild(h2);
      var time=document.createElement('time');
      time.className='text-text-secondary text-sm mt-auto';
      time.setAttribute('datetime',p.date||(p.data&&p.data.date)||'');
      time.textContent=new Date(p.date||(p.data&&p.data.date)||Date.now()).toLocaleDateString('pt-BR');
      body.appendChild(time);
      article.appendChild(body);
      grid.appendChild(article);
    });
    grid.setAttribute('data-admin-loaded','true');
    var emptyMsg=document.querySelector('.msg-empty-blog');
    if(emptyMsg)emptyMsg.style.display='none';
  }
  try{
    var raw=localStorage.getItem('admin_posts');
    if(raw){var arr=JSON.parse(raw);if(arr&&arr.length)render(arr);}
  }catch(e){}
   fetch(siteUrl('/api/admin.php?action=list')).then(function(r){return r.json();}).then(function(d){if(d.posts&&d.posts.length&&document.querySelector('#blog-grid-root[data-admin-loaded="false"]'))render(d.posts);}).catch(function(){});
  setInterval(function(){
    try{
      var raw=localStorage.getItem('admin_posts');
      if(raw){var arr=JSON.parse(raw);if(arr&&arr.length&&!document.querySelector('#blog-grid-root[data-admin-loaded="true"]'))render(arr);}
    }catch(e){}
  },300);
})();
