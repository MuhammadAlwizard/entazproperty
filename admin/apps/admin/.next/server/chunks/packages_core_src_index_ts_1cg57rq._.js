module.exports=[97920,e=>{"use strict";e.i(26696);var t=e.i(85089),a=e.i(66680),i=e.i(13654);function n(e){if(255!==e[0]||216!==e[1])return e;let t=[e.subarray(0,2)],a=2;for(;a+4<=e.length&&255===e[a];){let i=e[a+1];if(255===i){a+=1;continue}if(218===i)return t.push(e.subarray(a)),Buffer.concat(t);if(1===i||i>=208&&i<=216){t.push(e.subarray(a,a+2)),a+=2;continue}let n=e.readUInt16BE(a+2);if(n<2||a+2+n>e.length)break;225!==i&&237!==i&&254!==i&&t.push(e.subarray(a,a+2+n)),a+=2+n}return e}async function s(e){if(e.length>5242880)return{ok:!1,error:"Ukuran foto maksimal 5 MB."};let t=e.length>12&&255===e[0]&&216===e[1]&&255===e[2]?{ext:"jpg",mime:"image/jpeg"}:e.length>8&&e.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?{ext:"png",mime:"image/png"}:e.length>12&&"RIFF"===e.subarray(0,4).toString()&&"WEBP"===e.subarray(8,12).toString()?{ext:"webp",mime:"image/webp"}:null;if(!t)return{ok:!1,error:"Format foto harus JPG, PNG, atau WebP."};let s="jpg"===t.ext?n(e):e,r=(0,a.randomUUID)();return await (0,i.exec)("INSERT INTO uploads (id, ext, mime, bytes, size) VALUES (?,?,?,?,?)",[r,t.ext,t.mime,s,s.length]),{ok:!0,url:`/uploads/${r}.${t.ext}`}}let r=/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(jpg|png|webp)$/;async function o(e){let t=r.exec(e);if(!t)return null;let a=await (0,i.q1)("SELECT bytes, mime FROM uploads WHERE id = ? AND ext = ?",[t[1],t[2]]);return a?{id:t[1],body:Buffer.from(a.bytes),mime:a.mime}:null}e.s(["MAX_UPLOAD_BYTES",0,5242880,"readUpload",0,o,"saveImage",0,s,"stripJpegMetadata",0,n],8694);let l=e=>(0,a.createHash)("sha256").update(e).digest("hex"),T=e=>new Date(Date.now()-6e4*e);async function E(e,t,n){let s=(0,a.randomBytes)(32).toString("base64url"),r=new Date;await (0,i.exec)("INSERT INTO admin_sessions (id, token_hash, admin_id, last_seen_at, expires_at, ip, user_agent) VALUES (?,?,?,?,?,?,?)",[(0,a.randomUUID)(),l(s),e,r,new Date(r.getTime()+288e5),t.slice(0,64),n.slice(0,200)]);let o=T(10080);return await (0,i.exec)("DELETE FROM admin_sessions WHERE expires_at < ? OR revoked_at < ?",[o,o]),{token:s,maxAgeSeconds:28800}}async function N(e){let t=await (0,i.q1)(`SELECT s.id, a.id AS admin_id, a.email, a.must_change_password
       FROM admin_sessions s JOIN admins a ON a.id = s.admin_id
      WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > ? AND s.last_seen_at > ?
      LIMIT 1`,[l(e),new Date,T(45)]);return t?(await (0,i.exec)("UPDATE admin_sessions SET last_seen_at = ? WHERE id = ?",[new Date,t.id]),{sessionId:t.id,adminId:t.admin_id,email:t.email,mustChangePassword:1===t.must_change_password}):null}async function d(e){await (0,i.exec)("UPDATE admin_sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL",[new Date,l(e)])}async function m(e,t){return(t?await (0,i.exec)("UPDATE admin_sessions SET revoked_at = ? WHERE admin_id = ? AND revoked_at IS NULL AND id <> ?",[new Date,e,t]):await (0,i.exec)("UPDATE admin_sessions SET revoked_at = ? WHERE admin_id = ? AND revoked_at IS NULL",[new Date,e])).affectedRows}async function L(e,t){return(await (0,i.q)(`SELECT id, created_at, last_seen_at, ip, user_agent FROM admin_sessions
      WHERE admin_id = ? AND revoked_at IS NULL AND expires_at > ? AND last_seen_at > ?
      ORDER BY last_seen_at DESC`,[e,new Date,T(45)])).map(e=>({id:e.id,createdAt:new Date(e.created_at).toISOString(),lastSeenAt:new Date(e.last_seen_at).toISOString(),ip:e.ip,userAgent:e.user_agent,current:e.id===t}))}async function A(e){if(!e.length)return!1;let t=e.map(()=>"?").join(",");return null!==await (0,i.q1)(`SELECT 1 AS one FROM login_attempts WHERE attempt_key IN (${t}) AND fail_count >= ? AND first_at > ? LIMIT 1`,[...e,5,T(10)])}async function _(e){let t=new Date,a=T(10);for(let n of e)await (0,i.exec)(`INSERT INTO login_attempts (attempt_key, fail_count, first_at) VALUES (?, 1, ?)
       ON DUPLICATE KEY UPDATE
         fail_count = IF(first_at < ?, 1, fail_count + 1),
         first_at = IF(first_at < ?, ?, first_at)`,[n.slice(0,220),t,a,a,t])}async function u(e){e.length&&await (0,i.exec)(`DELETE FROM login_attempts WHERE attempt_key IN (${e.map(()=>"?").join(",")})`,e)}async function c(e){try{await (0,i.exec)("INSERT INTO audit_log (admin_email, action, target, detail, ip) VALUES (?,?,?,?,?)",[e.email.slice(0,200),e.action.slice(0,60),(e.target??"").slice(0,300),JSON.stringify(e.detail??{}),(e.ip??"").slice(0,64)])}catch(e){console.error("[audit] failed to write log:",e.message)}}async function g(e=100){return(await (0,i.q)(`SELECT id, created_at, admin_email, action, target, detail, ip FROM audit_log ORDER BY created_at DESC, id DESC LIMIT ${Math.max(1,Math.trunc(e))}`)).map(e=>({id:Number(e.id),at:new Date(e.created_at).toISOString(),email:e.admin_email,action:e.action,target:e.target,detail:(0,i.parseJson)(e.detail,{}),ip:e.ip}))}async function R(){let[e,t,a,n,s]=await Promise.all([(0,i.q)("SELECT * FROM listings ORDER BY id"),(0,i.q)("SELECT * FROM testimonials ORDER BY id"),(0,i.q)("SELECT setting_key AS `key`, setting_value AS `value` FROM settings ORDER BY setting_key"),(0,i.q)("SELECT id, email, created_at FROM admins ORDER BY id"),(0,i.q)("SELECT id, ext, mime, size, created_at FROM uploads ORDER BY created_at")]),r=e.map(e=>({...e,images:(0,i.parseJson)(e.images,[]),meta:(0,i.parseJson)(e.meta,{})}));return{exportedAt:new Date().toISOString(),note:"Foto tidak ikut di file ini (hanya daftar id). Password tidak pernah diekspor.",listings:r,testimonials:t,settings:a,admins:n,uploads:s}}e.s(["LOGIN_MAX_ATTEMPTS",0,5,"LOGIN_WINDOW_MINUTES",0,10,"SESSION_ABSOLUTE_HOURS",0,8,"SESSION_IDLE_MINUTES",0,45,"clearLoginFailures",0,u,"createAdminSession",0,E,"exportContent",0,R,"getAdminSession",0,N,"isLoginBlocked",0,A,"listAdminSessions",0,L,"listAudit",0,g,"logAudit",0,c,"recordLoginFailure",0,_,"revokeAdminSessions",0,m,"revokeSessionByToken",0,d],72227);var I=e.i(53746);let U="ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",O=(e,t,a)=>async i=>{let[n]=await i.query("SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",[e,t]);0===Number(n[0].n)&&await i.query(`ALTER TABLE ${e} ADD COLUMN ${t} ${a}`)},S=[{id:"001_baseline",statements:[`CREATE TABLE IF NOT EXISTS listings (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        category VARCHAR(10) NOT NULL,
        slug VARCHAR(120) NOT NULL,
        title VARCHAR(160) NOT NULL,
        summary VARCHAR(400) NOT NULL DEFAULT '',
        description TEXT NOT NULL,
        price INT UNSIGNED NOT NULL DEFAULT 0,
        location VARCHAR(200) NOT NULL DEFAULT '',
        address VARCHAR(400) NOT NULL DEFAULT '',
        maps_url VARCHAR(600) NOT NULL DEFAULT '',
        images LONGTEXT NOT NULL,
        meta LONGTEXT NOT NULL,
        published TINYINT(1) NOT NULL DEFAULT 1,
        featured TINYINT(1) NOT NULL DEFAULT 0,
        sort_order INT NOT NULL DEFAULT 0,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        UNIQUE KEY uq_listings_slug (slug),
        KEY idx_listings_category (category, published)
      ) ${U}`,`CREATE TABLE IF NOT EXISTS testimonials (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        origin VARCHAR(160) NOT NULL DEFAULT '',
        quote TEXT NOT NULL,
        photo VARCHAR(300) NOT NULL DEFAULT '',
        rating TINYINT UNSIGNED NOT NULL DEFAULT 5,
        published TINYINT(1) NOT NULL DEFAULT 1,
        sort_order INT NOT NULL DEFAULT 0
      ) ${U}`,`CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(60) NOT NULL PRIMARY KEY,
        setting_value TEXT NOT NULL
      ) ${U}`,`CREATE TABLE IF NOT EXISTS admins (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(200) NOT NULL,
        password_hash VARCHAR(300) NOT NULL,
        must_change_password TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        UNIQUE KEY uq_admins_email (email)
      ) ${U}`,`CREATE TABLE IF NOT EXISTS admin_sessions (
        id CHAR(36) NOT NULL PRIMARY KEY,
        token_hash CHAR(64) NOT NULL,
        admin_id INT UNSIGNED NOT NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        last_seen_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        expires_at DATETIME(3) NOT NULL,
        revoked_at DATETIME(3) NULL,
        ip VARCHAR(64) NOT NULL DEFAULT '',
        user_agent VARCHAR(200) NOT NULL DEFAULT '',
        UNIQUE KEY uq_admin_sessions_token (token_hash),
        KEY idx_admin_sessions_admin (admin_id),
        CONSTRAINT fk_admin_sessions_admin FOREIGN KEY (admin_id) REFERENCES admins (id) ON DELETE CASCADE
      ) ${U}`,`CREATE TABLE IF NOT EXISTS login_attempts (
        attempt_key VARCHAR(220) NOT NULL PRIMARY KEY,
        fail_count INT NOT NULL DEFAULT 0,
        first_at DATETIME(3) NOT NULL
      ) ${U}`,`CREATE TABLE IF NOT EXISTS audit_log (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        admin_email VARCHAR(200) NOT NULL DEFAULT '',
        action VARCHAR(60) NOT NULL,
        target VARCHAR(300) NOT NULL DEFAULT '',
        detail TEXT NOT NULL,
        ip VARCHAR(64) NOT NULL DEFAULT '',
        KEY idx_audit_log_created (created_at)
      ) ${U}`,`CREATE TABLE IF NOT EXISTS uploads (
        id CHAR(36) NOT NULL PRIMARY KEY,
        ext VARCHAR(4) NOT NULL,
        mime VARCHAR(20) NOT NULL,
        bytes LONGBLOB NOT NULL,
        size INT UNSIGNED NOT NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
      ) ${U}`]},{id:"002_translations",statements:[O("listings","translations","LONGTEXT NULL"),O("testimonials","translations","LONGTEXT NULL")]}];async function p(){let e=await (0,i.pool)().getConnection();try{await e.query("SELECT GET_LOCK('enjaz_migrate', 60)"),await e.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
         id VARCHAR(100) NOT NULL PRIMARY KEY,
         applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
       ) ${U}`);let[t]=await e.query("SELECT id FROM schema_migrations"),a=new Set(t.map(e=>e.id)),i=[];for(let t of S)if(!a.has(t.id)){for(let a of t.statements)"string"==typeof a?await e.query(a):await a(e);await e.query("INSERT INTO schema_migrations (id) VALUES (?)",[t.id]),i.push(t.id)}return i}finally{await e.query("SELECT RELEASE_LOCK('enjaz_migrate')").catch(()=>{}),e.release()}}async function D(){let a=await p();if(a.length&&console.log(`[db] migrasi dijalankan: ${a.join(", ")}`),"1"===process.env.SEED_SAMPLE){let{seedSampleContent:t}=await e.A(4060),a=await t();(a.listings||a.testimonials)&&console.log(`[db] data contoh (PALSU) ditambahkan: ${a.listings} listing, ${a.testimonials} testimoni. Hapus SEED_SAMPLE dari environment.`)}let i=process.env.ADMIN_EMAIL,n=process.env.ADMIN_PASSWORD;if(!i||!n||await (0,t.countAdmins)()>0)return;let s=(0,I.checkNewPassword)(n,i);s?console.error(`[db] admin pertama TIDAK dibuat, ADMIN_PASSWORD ditolak: ${s}`):(await (0,t.createAdmin)(i,(0,I.hashPassword)(n),!0),console.log(`[db] admin pertama dibuat: ${i} (wajib ganti password saat login pertama)`))}e.s([],3810),e.i(3810);var k=e.i(79314);e.i(22572);let f=e=>"string"==typeof e?e.trim():"";function h(e){let t=f(e).replace(/[^\d]/g,"");return t?Number.parseInt(t,10):NaN}function M(e){return/^\/uploads\/[a-f0-9-]+\.(jpg|png|webp)$/.test(e)||/^https:\/\/[^\s]+$/.test(e)}e.s(["isSafeImage",0,M,"parsePrice",0,h,"validateListing",0,function(e){let t={},a=f(e.category);if(!(0,k.isCategory)(a))return{ok:!1,errors:{category:"Pilih kategori."}};let i=k.CATEGORY_CONFIG[a],n=f(e.title);n.length<3&&(t.title="Nama listing minimal 3 karakter."),n.length>120&&(t.title="Nama listing maksimal 120 karakter.");let s=h(e.price);Number.isNaN(s)?t.price="Isi harga dengan angka.":s>1e9&&(t.price="Harga terlalu besar.");let r=f(e.location);i.locationRequired&&!r&&(t.location=`${i.locationLabel} wajib diisi.`),r.length>120&&(t.location="Lokasi maksimal 120 karakter.");let o=f(e.address);o.length>300&&(t.address="Alamat maksimal 300 karakter.");let l=f(e.mapsUrl);l&&!/^https:\/\/[^\s]+$/.test(l)&&(t.mapsUrl="Link peta harus diawali https://"),l.length>500&&(t.mapsUrl="Link peta terlalu panjang.");let T=f(e.summary);T.length>200&&(t.summary="Ringkasan maksimal 200 karakter.");let E=f(e.description);E.length>5e3&&(t.description="Deskripsi maksimal 5000 karakter.");let N=Array.isArray(e.images)?e.images.map(f).filter(Boolean):[];N.length>k.MAX_LISTING_IMAGES&&(t.images=`Maksimal ${k.MAX_LISTING_IMAGES} foto.`),N.some(e=>!M(e))&&(t.images="Ada foto dengan alamat tidak valid.");let d={};for(let a of i.fields){let i=f(e[`meta_${a.key}`]);i&&("number"!==a.type||/^\d{1,6}$/.test(i)?"select"!==a.type||a.options?.includes(i)?i.length>200?t[`meta_${a.key}`]=`${a.label} terlalu panjang.`:d[a.key]=i:t[`meta_${a.key}`]=`${a.label} tidak valid.`:t[`meta_${a.key}`]=`${a.label} harus berupa angka.`)}let m=function(e,t,a){let i={},n=[["title",160],["summary",200],["description",5e3],["location",120]];for(let s of k.TRANSLATION_LANGS){let r={};for(let[t,i]of n){let n=`tr_${s}_${t}`,o=f(e[n]);o&&(o.length>i?a[n]=`Maksimal ${i} karakter.`:r[t]=o)}let o={};for(let i of(0,k.translatableMetaFields)(t)){let t=`tr_${s}_meta_${i.key}`,n=f(e[t]);n&&(n.length>200?a[t]="Maksimal 200 karakter.":o[i.key]=n)}Object.keys(o).length&&(r.meta=o),Object.keys(r).length&&(i[s]=r)}return i}(e,a,t);return Object.keys(t).length?{ok:!1,errors:t}:{ok:!0,data:{category:a,title:n,summary:T,description:E,price:s,location:r,address:o,mapsUrl:l,images:N,meta:d,translations:m,published:"on"===e.published||!0===e.published,featured:"on"===e.featured||!0===e.featured}}},"validateTestimonial",0,function(e){let t={},a=f(e.name),i=f(e.quote),n=f(e.origin),s=Number.parseInt(f(e.rating)||"5",10);a.length<2&&(t.name="Nama minimal 2 karakter."),a.length>80&&(t.name="Nama maksimal 80 karakter."),i.length<10&&(t.quote="Isi testimoni minimal 10 karakter."),i.length>600&&(t.quote="Isi testimoni maksimal 600 karakter."),n.length>100&&(t.origin="Keterangan maksimal 100 karakter.");let r=f(e.photo);r&&!M(r)&&(t.photo="Alamat foto tidak valid."),s>=1&&s<=5||(t.rating="Rating 1 sampai 5.");let o={};for(let a of k.TRANSLATION_LANGS){let i=f(e[`tr_${a}_quote`]),n=f(e[`tr_${a}_origin`]);i.length>600&&(t[`tr_${a}_quote`]="Maksimal 600 karakter."),n.length>100&&(t[`tr_${a}_origin`]="Maksimal 100 karakter."),(i||n)&&(o[a]={...i&&{quote:i},...n&&{origin:n}})}return Object.keys(t).length?{ok:!1,errors:t}:{ok:!0,data:{name:a,quote:i,origin:n,photo:r,translations:o,rating:s,published:"on"===e.published||!0===e.published}}}],1227),e.i(1227),e.i(8694),e.i(72227);let y=(e,t)=>e&&e.trim()?e:t;e.s(["localizeListing",0,function(e,t){if("id"===t)return e;let a=e.translations[t];if(!a)return e;let i={...e.meta};for(let[e,t]of Object.entries(a.meta??{}))t.trim()&&(i[e]=t);return{...e,title:y(a.title,e.title),summary:y(a.summary,e.summary),description:y(a.description,e.description),location:y(a.location,e.location),meta:i}},"localizeTestimonial",0,function(e,t){if("id"===t)return e;let a=e.translations[t];return a?{...e,quote:y(a.quote,e.quote),origin:y(a.origin,e.origin)}:e}],69415),e.i(69415),e.s(["bootstrap",0,D],97920)}];

//# sourceMappingURL=packages_core_src_index_ts_1cg57rq._.js.map