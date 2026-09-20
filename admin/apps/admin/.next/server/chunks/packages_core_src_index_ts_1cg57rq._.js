module.exports=[97920,e=>{"use strict";e.i(26696);var t=e.i(85089),a=e.i(66680),i=e.i(7773),n=e.i(13654);function s(e){if(255!==e[0]||216!==e[1])return e;let t=[e.subarray(0,2)],a=2;for(;a+4<=e.length&&255===e[a];){let i=e[a+1];if(255===i){a+=1;continue}if(218===i)return t.push(e.subarray(a)),Buffer.concat(t);if(1===i||i>=208&&i<=216){t.push(e.subarray(a,a+2)),a+=2;continue}let n=e.readUInt16BE(a+2);if(n<2||a+2+n>e.length)break;225!==i&&237!==i&&254!==i&&t.push(e.subarray(a,a+2+n)),a+=2+n}return e}async function r(e,t=i.UPLOAD_ID){if(e.length>5242880)return{ok:!1,error:t.tooLarge};let o=e.length>12&&255===e[0]&&216===e[1]&&255===e[2]?{ext:"jpg",mime:"image/jpeg"}:e.length>8&&e.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?{ext:"png",mime:"image/png"}:e.length>12&&"RIFF"===e.subarray(0,4).toString()&&"WEBP"===e.subarray(8,12).toString()?{ext:"webp",mime:"image/webp"}:null;if(!o)return{ok:!1,error:t.badFormat};let l="jpg"===o.ext?s(e):e,T=(0,a.randomUUID)();return await (0,n.exec)("INSERT INTO uploads (id, ext, mime, bytes, size) VALUES (?,?,?,?,?)",[T,o.ext,o.mime,l,l.length]),{ok:!0,url:`/uploads/${T}.${o.ext}`}}let o=/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(jpg|png|webp)$/;async function l(e){let t=o.exec(e);if(!t)return null;let a=await (0,n.q1)("SELECT bytes, mime FROM uploads WHERE id = ? AND ext = ?",[t[1],t[2]]);return a?{id:t[1],body:Buffer.from(a.bytes),mime:a.mime}:null}e.s(["MAX_UPLOAD_BYTES",0,5242880,"readUpload",0,l,"saveImage",0,r,"stripJpegMetadata",0,s],8694);let T=e=>(0,a.createHash)("sha256").update(e).digest("hex"),E=e=>new Date(Date.now()-6e4*e);async function N(e,t,i){let s=(0,a.randomBytes)(32).toString("base64url"),r=new Date;await (0,n.exec)("INSERT INTO admin_sessions (id, token_hash, admin_id, last_seen_at, expires_at, ip, user_agent) VALUES (?,?,?,?,?,?,?)",[(0,a.randomUUID)(),T(s),e,r,new Date(r.getTime()+288e5),t.slice(0,64),i.slice(0,200)]);let o=E(10080);return await (0,n.exec)("DELETE FROM admin_sessions WHERE expires_at < ? OR revoked_at < ?",[o,o]),{token:s,maxAgeSeconds:28800}}async function d(e){let t=await (0,n.q1)(`SELECT s.id, a.id AS admin_id, a.email, a.must_change_password
       FROM admin_sessions s JOIN admins a ON a.id = s.admin_id
      WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > ? AND s.last_seen_at > ?
      LIMIT 1`,[T(e),new Date,E(45)]);return t?(await (0,n.exec)("UPDATE admin_sessions SET last_seen_at = ? WHERE id = ?",[new Date,t.id]),{sessionId:t.id,adminId:t.admin_id,email:t.email,mustChangePassword:1===t.must_change_password}):null}async function L(e){await (0,n.exec)("UPDATE admin_sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL",[new Date,T(e)])}async function A(e,t){return(t?await (0,n.exec)("UPDATE admin_sessions SET revoked_at = ? WHERE admin_id = ? AND revoked_at IS NULL AND id <> ?",[new Date,e,t]):await (0,n.exec)("UPDATE admin_sessions SET revoked_at = ? WHERE admin_id = ? AND revoked_at IS NULL",[new Date,e])).affectedRows}async function m(e,t){return(await (0,n.q)(`SELECT id, created_at, last_seen_at, ip, user_agent FROM admin_sessions
      WHERE admin_id = ? AND revoked_at IS NULL AND expires_at > ? AND last_seen_at > ?
      ORDER BY last_seen_at DESC`,[e,new Date,E(45)])).map(e=>({id:e.id,createdAt:new Date(e.created_at).toISOString(),lastSeenAt:new Date(e.last_seen_at).toISOString(),ip:e.ip,userAgent:e.user_agent,current:e.id===t}))}async function _(e){if(!e.length)return!1;let t=e.map(()=>"?").join(",");return null!==await (0,n.q1)(`SELECT 1 AS one FROM login_attempts WHERE attempt_key IN (${t}) AND fail_count >= ? AND first_at > ? LIMIT 1`,[...e,5,E(10)])}async function u(e){let t=new Date,a=E(10);for(let i of e)await (0,n.exec)(`INSERT INTO login_attempts (attempt_key, fail_count, first_at) VALUES (?, 1, ?)
       ON DUPLICATE KEY UPDATE
         fail_count = IF(first_at < ?, 1, fail_count + 1),
         first_at = IF(first_at < ?, ?, first_at)`,[i.slice(0,220),t,a,a,t])}async function c(e){e.length&&await (0,n.exec)(`DELETE FROM login_attempts WHERE attempt_key IN (${e.map(()=>"?").join(",")})`,e)}async function g(e){try{await (0,n.exec)("INSERT INTO audit_log (admin_email, action, target, detail, ip) VALUES (?,?,?,?,?)",[e.email.slice(0,200),e.action.slice(0,60),(e.target??"").slice(0,300),JSON.stringify(e.detail??{}),(e.ip??"").slice(0,64)])}catch(e){console.error("[audit] failed to write log:",e.message)}}async function I(e=100){return(await (0,n.q)(`SELECT id, created_at, admin_email, action, target, detail, ip FROM audit_log ORDER BY created_at DESC, id DESC LIMIT ${Math.max(1,Math.trunc(e))}`)).map(e=>({id:Number(e.id),at:new Date(e.created_at).toISOString(),email:e.admin_email,action:e.action,target:e.target,detail:(0,n.parseJson)(e.detail,{}),ip:e.ip}))}async function R(){let[e,t,a,i,s]=await Promise.all([(0,n.q)("SELECT * FROM listings ORDER BY id"),(0,n.q)("SELECT * FROM testimonials ORDER BY id"),(0,n.q)("SELECT setting_key AS `key`, setting_value AS `value` FROM settings ORDER BY setting_key"),(0,n.q)("SELECT id, email, created_at FROM admins ORDER BY id"),(0,n.q)("SELECT id, ext, mime, size, created_at FROM uploads ORDER BY created_at")]),r=e.map(e=>({...e,images:(0,n.parseJson)(e.images,[]),meta:(0,n.parseJson)(e.meta,{})}));return{exportedAt:new Date().toISOString(),note:"Foto tidak ikut di file ini (hanya daftar id). Password tidak pernah diekspor.",listings:r,testimonials:t,settings:a,admins:i,uploads:s}}e.s(["LOGIN_MAX_ATTEMPTS",0,5,"LOGIN_WINDOW_MINUTES",0,10,"SESSION_ABSOLUTE_HOURS",0,8,"SESSION_IDLE_MINUTES",0,45,"clearLoginFailures",0,c,"createAdminSession",0,N,"exportContent",0,R,"getAdminSession",0,d,"isLoginBlocked",0,_,"listAdminSessions",0,m,"listAudit",0,I,"logAudit",0,g,"recordLoginFailure",0,u,"revokeAdminSessions",0,A,"revokeSessionByToken",0,L],72227);var U=e.i(53746);let O="ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",S=(e,t,a)=>async i=>{let[n]=await i.query("SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",[e,t]);0===Number(n[0].n)&&await i.query(`ALTER TABLE ${e} ADD COLUMN ${t} ${a}`)},p=[{id:"001_baseline",statements:[`CREATE TABLE IF NOT EXISTS listings (
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
      ) ${O}`,`CREATE TABLE IF NOT EXISTS testimonials (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        origin VARCHAR(160) NOT NULL DEFAULT '',
        quote TEXT NOT NULL,
        photo VARCHAR(300) NOT NULL DEFAULT '',
        rating TINYINT UNSIGNED NOT NULL DEFAULT 5,
        published TINYINT(1) NOT NULL DEFAULT 1,
        sort_order INT NOT NULL DEFAULT 0
      ) ${O}`,`CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(60) NOT NULL PRIMARY KEY,
        setting_value TEXT NOT NULL
      ) ${O}`,`CREATE TABLE IF NOT EXISTS admins (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(200) NOT NULL,
        password_hash VARCHAR(300) NOT NULL,
        must_change_password TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        UNIQUE KEY uq_admins_email (email)
      ) ${O}`,`CREATE TABLE IF NOT EXISTS admin_sessions (
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
      ) ${O}`,`CREATE TABLE IF NOT EXISTS login_attempts (
        attempt_key VARCHAR(220) NOT NULL PRIMARY KEY,
        fail_count INT NOT NULL DEFAULT 0,
        first_at DATETIME(3) NOT NULL
      ) ${O}`,`CREATE TABLE IF NOT EXISTS audit_log (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        admin_email VARCHAR(200) NOT NULL DEFAULT '',
        action VARCHAR(60) NOT NULL,
        target VARCHAR(300) NOT NULL DEFAULT '',
        detail TEXT NOT NULL,
        ip VARCHAR(64) NOT NULL DEFAULT '',
        KEY idx_audit_log_created (created_at)
      ) ${O}`,`CREATE TABLE IF NOT EXISTS uploads (
        id CHAR(36) NOT NULL PRIMARY KEY,
        ext VARCHAR(4) NOT NULL,
        mime VARCHAR(20) NOT NULL,
        bytes LONGBLOB NOT NULL,
        size INT UNSIGNED NOT NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
      ) ${O}`]},{id:"002_translations",statements:[S("listings","translations","LONGTEXT NULL"),S("testimonials","translations","LONGTEXT NULL")]}];async function D(){let e=await (0,n.pool)().getConnection();try{await e.query("SELECT GET_LOCK('enjaz_migrate', 60)"),await e.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
         id VARCHAR(100) NOT NULL PRIMARY KEY,
         applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
       ) ${O}`);let[t]=await e.query("SELECT id FROM schema_migrations"),a=new Set(t.map(e=>e.id)),i=[];for(let t of p)if(!a.has(t.id)){for(let a of t.statements)"string"==typeof a?await e.query(a):await a(e);await e.query("INSERT INTO schema_migrations (id) VALUES (?)",[t.id]),i.push(t.id)}return i}finally{await e.query("SELECT RELEASE_LOCK('enjaz_migrate')").catch(()=>{}),e.release()}}async function f(){let a=await D();if(a.length&&console.log(`[db] migrasi dijalankan: ${a.join(", ")}`),"1"===process.env.SEED_SAMPLE){let{seedSampleContent:t}=await e.A(4060),a=await t();(a.listings||a.testimonials)&&console.log(`[db] data contoh (PALSU) ditambahkan: ${a.listings} listing, ${a.testimonials} testimoni. Hapus SEED_SAMPLE dari environment.`)}let i=process.env.ADMIN_EMAIL,n=process.env.ADMIN_PASSWORD;if(!i||!n||await (0,t.countAdmins)()>0)return;let s=(0,U.checkNewPassword)(n,i);s?console.error(`[db] admin pertama TIDAK dibuat, ADMIN_PASSWORD ditolak: ${s}`):(await (0,t.createAdmin)(i,(0,U.hashPassword)(n),!0),console.log(`[db] admin pertama dibuat: ${i} (wajib ganti password saat login pertama)`))}e.s([],3810),e.i(3810);var M=e.i(79314);e.i(22572);let h=e=>"string"==typeof e?e.trim():"";function C(e){let t=h(e).replace(/[^\d]/g,"");return t?Number.parseInt(t,10):NaN}function y(e){return/^\/uploads\/[a-f0-9-]+\.(jpg|png|webp)$/.test(e)||/^https:\/\/[^\s]+$/.test(e)}e.s(["isSafeImage",0,y,"parsePrice",0,C,"validateListing",0,function(e,t={}){let a=t.messages??i.VALIDATION_ID,n={},s=h(e.category);if(!(0,M.isCategory)(s))return{ok:!1,errors:{category:a.chooseCategory}};let r=M.CATEGORY_CONFIG[s],o=(e,a)=>t.fieldLabel?.(s,e)??a,l=h(e.title);l.length<3&&(n.title=a.titleMin),l.length>120&&(n.title=a.titleMax);let T=C(e.price);Number.isNaN(T)?n.price=a.priceNumber:T>1e9&&(n.price=a.priceTooBig);let E=h(e.location);r.locationRequired&&!E&&(n.location=(0,i.fillMessage)(a.locationRequired,{label:t.locationLabel?.(s)??r.locationLabel})),E.length>120&&(n.location=a.locationMax);let N=h(e.address);N.length>300&&(n.address=a.addressMax);let d=h(e.mapsUrl);d&&!/^https:\/\/[^\s]+$/.test(d)&&(n.mapsUrl=a.mapsHttps),d.length>500&&(n.mapsUrl=a.mapsTooLong);let L=h(e.summary);L.length>200&&(n.summary=a.summaryMax);let A=h(e.description);A.length>5e3&&(n.description=a.descriptionMax);let m=Array.isArray(e.images)?e.images.map(h).filter(Boolean):[];m.length>M.MAX_LISTING_IMAGES&&(n.images=(0,i.fillMessage)(a.imagesMax,{max:M.MAX_LISTING_IMAGES})),m.some(e=>!y(e))&&(n.images=a.imagesInvalid);let _={};for(let t of r.fields){let s=h(e[`meta_${t.key}`]);if(!s)continue;let r=o(t.key,t.label);"number"!==t.type||/^\d{1,6}$/.test(s)?"select"!==t.type||t.options?.includes(s)?s.length>200?n[`meta_${t.key}`]=(0,i.fillMessage)(a.fieldTooLong,{label:r}):_[t.key]=s:n[`meta_${t.key}`]=(0,i.fillMessage)(a.fieldInvalid,{label:r}):n[`meta_${t.key}`]=(0,i.fillMessage)(a.fieldNumber,{label:r})}let u=function(e,t,a,n){let s={},r=[["title",160],["summary",200],["description",5e3],["location",120]];for(let o of M.TRANSLATION_LANGS){let l={};for(let[t,s]of r){let r=`tr_${o}_${t}`,T=h(e[r]);T&&(T.length>s?a[r]=(0,i.fillMessage)(n.maxChars,{max:s}):l[t]=T)}let T={};for(let s of(0,M.translatableMetaFields)(t)){let t=`tr_${o}_meta_${s.key}`,r=h(e[t]);r&&(r.length>200?a[t]=(0,i.fillMessage)(n.maxChars,{max:200}):T[s.key]=r)}Object.keys(T).length&&(l.meta=T),Object.keys(l).length&&(s[o]=l)}return s}(e,s,n,a);return Object.keys(n).length?{ok:!1,errors:n}:{ok:!0,data:{category:s,title:l,summary:L,description:A,price:T,location:E,address:N,mapsUrl:d,images:m,meta:_,translations:u,published:"on"===e.published||!0===e.published,featured:"on"===e.featured||!0===e.featured}}},"validateTestimonial",0,function(e,t={}){let a=t.messages??i.VALIDATION_ID,n={},s=h(e.name),r=h(e.quote),o=h(e.origin),l=Number.parseInt(h(e.rating)||"5",10);s.length<2&&(n.name=a.nameMin),s.length>80&&(n.name=a.nameMax),r.length<10&&(n.quote=a.quoteMin),r.length>600&&(n.quote=a.quoteMax),o.length>100&&(n.origin=a.originMax);let T=h(e.photo);T&&!y(T)&&(n.photo=a.photoInvalid),l>=1&&l<=5||(n.rating=a.ratingRange);let E={};for(let t of M.TRANSLATION_LANGS){let s=h(e[`tr_${t}_quote`]),r=h(e[`tr_${t}_origin`]);s.length>600&&(n[`tr_${t}_quote`]=(0,i.fillMessage)(a.maxChars,{max:600})),r.length>100&&(n[`tr_${t}_origin`]=(0,i.fillMessage)(a.maxChars,{max:100})),(s||r)&&(E[t]={...s&&{quote:s},...r&&{origin:r}})}return Object.keys(n).length?{ok:!1,errors:n}:{ok:!0,data:{name:s,quote:r,origin:o,photo:T,translations:E,rating:l,published:"on"===e.published||!0===e.published}}}],1227),e.i(1227),e.i(8694),e.i(72227);let w=(e,t)=>e&&e.trim()?e:t;e.s(["localizeListing",0,function(e,t){if("id"===t)return e;let a=e.translations[t];if(!a)return e;let i={...e.meta};for(let[e,t]of Object.entries(a.meta??{}))t.trim()&&(i[e]=t);return{...e,title:w(a.title,e.title),summary:w(a.summary,e.summary),description:w(a.description,e.description),location:w(a.location,e.location),meta:i}},"localizeTestimonial",0,function(e,t){if("id"===t)return e;let a=e.translations[t];return a?{...e,quote:w(a.quote,e.quote),origin:w(a.origin,e.origin)}:e}],69415),e.i(69415),e.s(["bootstrap",0,f],97920)}];

//# sourceMappingURL=packages_core_src_index_ts_1cg57rq._.js.map