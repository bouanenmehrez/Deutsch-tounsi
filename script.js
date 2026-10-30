const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
let currentUser = null;
async function syncFromCloud(){
 if(!currentUser) return;
 const {data: progress, error:pErr}=await supabaseClient.from('lesson_progress').select('lesson_id,completed').eq('user_id',currentUser.id);
 if(!pErr && progress){state.completed=progress.filter(x=>x.completed).map(x=>x.lesson_id);}
 const {data: attempts, error:aErr}=await supabaseClient.from('quiz_attempts').select('score,total,attempted_at').eq('user_id',currentUser.id).order('attempted_at');
 if(!aErr && attempts){state.scores=attempts.map(x=>({date:x.attempted_at,score:x.score,total:x.total}));}
 const {data: profile}=await supabaseClient.from('profiles').select('display_name').eq('id',currentUser.id).maybeSingle();
 if(profile?.display_name) state.name=profile.display_name;
 localStorage.setItem('dt_state',JSON.stringify(state)); updateDashboard(); loadLesson(currentLesson);
}
async function saveLessonCloud(lessonId){
 if(!currentUser) return;
 const {error}=await supabaseClient.from('lesson_progress').upsert({user_id:currentUser.id,lesson_id:lessonId,completed:true,completed_at:new Date().toISOString(),updated_at:new Date().toISOString()});
 if(error) toast('ما نجّمش نحفظ التقدّم أونلاين: '+error.message);
}
async function saveQuizCloud(score,total){
 if(!currentUser) return;
 const {error}=await supabaseClient.from('quiz_attempts').insert({user_id:currentUser.id,quiz_id:'a1-basic',score,total});
 if(error) toast('ما نجّمش نحفظ نتيجة الاختبار أونلاين: '+error.message);
}

let currentRole='student';
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function refreshRole(){if(!currentUser){currentRole='student';applyRoleUI();return;}const {data,error}=await supabaseClient.from('profiles').select('display_name,role').eq('id',currentUser.id).maybeSingle();currentRole=error?'student':(data?.role||'student');if(data?.display_name)state.name=data.display_name;applyRoleUI();}
function applyRoleUI(){const admin=currentRole==='admin';$('#adminNav').hidden=!admin;$('#adminPanel').hidden=!admin;if(admin)loadAdminPanel();}
async function loadAdminPanel(){if(currentRole!=='admin'||!currentUser)return;const [pr,pg,qa,lr]=await Promise.all([supabaseClient.from('profiles').select('id,display_name,created_at').order('created_at',{ascending:false}),supabaseClient.from('lesson_progress').select('user_id,lesson_id,completed'),supabaseClient.from('quiz_attempts').select('user_id,score,total'),supabaseClient.from('lessons').select('id,level,title,published,sort_order').order('level').order('sort_order')]);for(const r of [pr,pg,qa,lr])if(r.error){toast('خطأ في لوحة الإدارة: '+r.error.message);return;}const students=pr.data||[],progress=pg.data||[],attempts=qa.data||[],lessonsData=lr.data||[];$('#adminStats').innerHTML=`<div><b>${students.length}</b><span>حساب طالب</span></div><div><b>${progress.filter(x=>x.completed).length}</b><span>دروس مكتملة</span></div><div><b>${attempts.length}</b><span>محاولات اختبار</span></div>`;$('#adminStudents').innerHTML=students.map(p=>`<tr><td>${esc(p.display_name||'طالب')}</td><td>${progress.filter(x=>x.user_id===p.id&&x.completed).length}</td><td>${attempts.filter(x=>x.user_id===p.id).length}</td></tr>`).join('')||'<tr><td colspan="3">ما فماش طلبة مسجّلين.</td></tr>';$('#adminLessons').innerHTML=lessonsData.map(l=>`<div class="admin-lesson-row"><span><b>${esc(l.level)}</b> — ${esc(l.title)} <small>(${esc(l.id)})</small></span><button data-toggle-lesson="${esc(l.id)}" data-published="${l.published}">${l.published?'إخفاء':'نشر'}</button></div>`).join('')||'ما فماش دروس.';document.querySelectorAll('[data-toggle-lesson]').forEach(btn=>btn.onclick=async()=>{const {error}=await supabaseClient.from('lessons').update({published:btn.dataset.published!=='true'}).eq('id',btn.dataset.toggleLesson);if(error)toast('خطأ: '+error.message);else{toast('تحدّثت حالة الدرس.');loadAdminPanel();}});}

function showAuthState(){
 const logged=!!currentUser;
 $('#authStatus').textContent=logged?`داخل بحساب: ${currentUser.email}`:'اعمل حساب جديد أو ادخل لحسابك باش يتسجّل تقدّمك أونلاين.';
 $('#signUpButton').hidden=logged; $('#signInButton').hidden=logged; $('#signOutButton').hidden=!logged;
 $('#studentName').disabled=logged; $('#authEmail').disabled=logged; $('#authPassword').hidden=logged;
}
async function authAction(mode){
 const email=$('#authEmail').value.trim(), password=$('#authPassword').value, name=$('#studentName').value.trim();
 if(!email || !password){toast('اكتب البريد الإلكتروني وكلمة السر.');return;}
 let result;
 if(mode==='signup') result=await supabaseClient.auth.signUp({email,password,options:{data:{display_name:name}}});
 else result=await supabaseClient.auth.signInWithPassword({email,password});
 if(result.error){toast(result.error.message);return;}
 if(mode==='signup' && !result.data.session){toast('تعمل الحساب! افتح بريدك وأكّد التسجيل، وبعد ارجع اعمل دخول.');return;}
 currentUser=result.data.user; state.name=name || currentUser.user_metadata?.display_name || '';
 if(currentUser){await supabaseClient.from('profiles').upsert({id:currentUser.id,display_name:state.name}); await syncFromCloud(); await refreshRole();}
 showAuthState(); toast(mode==='signup'?'الحساب تخلق بنجاح!':'مرحبا بيك من جديد!');
}
const courses = [
 {level:"A1",title:"مبتدئ",desc:"الحروف، التحيات، التعارف، الأرقام والجمل البسيطة.",lessons:24,detail:"تتعلّم تقدّم روحك وتحكي على حياتك اليومية."},
 {level:"A2",title:"أساسي",desc:"الماضي، التسوّق، التنقّل، المواعيد والمحادثات اليومية.",lessons:16,detail:"توسّع مفرداتك وتفهم مواقف أكثر."},
 {level:"B1",title:"متوسّط",desc:"التعبير على الرأي، التجارب، العمل والدراسة.",lessons:20,detail:"تتعلّم تحكي باستقلالية في مواضيع مألوفة."},
 {level:"B2",title:"فوق المتوسّط",desc:"نقاشات، نصوص أطول، حجج وتحضير متقدّم.",lessons:20,detail:"تطوّر الفهم والتعبير بمستوى أعمق."}
];
const lessons = [
{id:"a1-1",level:"A1",title:"التحيات والتعارف",subtitle:"تسلّم على الناس، تعرّف بروحك وتسأل على الاسم.",items:[["Hallo!","سلام / أهلا"],["Guten Morgen!","صباح الخير"],["Guten Tag!","نهارك طيّب"],["Guten Abend!","مساء الخير"],["Wie heißt du?","شنوّة اسمك؟"],["Ich heiße …","اسمي …"],["Wie geht es dir?","كيفاش حالك؟"],["Mir geht es gut, danke.","لاباس، شكراً."],["Auf Wiedersehen!","إلى اللقاء"]],note:"مع شخص تعرفه استعمل du. مع شخص رسمي أو أكبر منك استعمل Sie: Wie heißen Sie? مثال: Hallo, ich heiße Sami. Wie heißt du?"},
{id:"a1-2",level:"A1",title:"الأبجدية والنطق",subtitle:"تعرّف على الحروف الألمانية وبعض الأصوات المهمّة.",items:[["A, B, C …","الأبجدية اللاتينية"],["Ä / ä","صوت قريب من e مفتوحة"],["Ö / ö","صوت بين o و e"],["Ü / ü","صوت u مع تدوير الشفتين"],["ß","تُنطق ss"],["sch","صوت ش"],["ch","صوت خفيف يختلف حسب الكلمة"],["ei","تُنطق آي مثل mein"],["ie","تُنطق إي طويلة مثل sieben"]],note:"الألمانية فيها 26 حرفاً أساسياً وزيد عليهم ä, ö, ü و ß. اسمع الكلمة وعاود نطقها؛ النطق يتحسّن بالتدريب."},
{id:"a1-3",level:"A1",title:"الضمائر الشخصية",subtitle:"الضمائر اللي تعوّض أسماء الأشخاص.",items:[["ich","أنا"],["du","إنتَ / إنتِ"],["er","هو"],["sie","هي"],["es","هو/هي لغير العاقل"],["wir","إحنا"],["ihr","إنتوما"],["sie","هما"],["Sie","حضرتك / حضراتكم باحترام"]],note:"فرّق بين sie بحرف صغير (هي أو هم) وSie بحرف كبير (صيغة الاحترام)."},
{id:"a1-4",level:"A1",title:"الفعل sein",subtitle:"الفعل يكون: من أهم الأفعال في الألمانية.",items:[["ich bin","أنا"],["du bist","إنت"],["er / sie / es ist","هو / هي"],["wir sind","إحنا"],["ihr seid","إنتوما"],["sie / Sie sind","هما / حضرتك"],["Ich bin müde.","أنا تعبان."],["Wir sind in Tunis.","إحنا في تونس."]],note:"احفظ التصريف كما هو: ich bin, du bist, er ist, wir sind, ihr seid, sie sind. مثال: Ich bin Student. = أنا طالب."},
{id:"a1-5",level:"A1",title:"الفعل haben",subtitle:"كيفاش تقول عندي وعندك وعندو.",items:[["ich habe","عندي"],["du hast","عندك"],["er / sie hat","عندو / عندها"],["wir haben","عندنا"],["ihr habt","عندكم"],["sie haben","عندهم"],["Ich habe einen Bruder.","عندي أخ."],["Hast du Zeit?","عندك وقت؟"]],note:"الفعل haben يتبدّل: habe, hast, hat, haben, habt, haben. استعمله للعائلة والأشياء والعمر في بعض التعابير."},
{id:"a1-6",level:"A1",title:"الأرقام والعمر",subtitle:"الأرقام من صفر إلى مئة والسؤال على العمر.",items:[["null, eins, zwei","0، 1، 2"],["drei, vier, fünf","3، 4، 5"],["sechs, sieben, acht","6، 7، 8"],["neun, zehn","9، 10"],["elf, zwölf","11، 12"],["zwanzig","20"],["dreißig","30"],["einundzwanzig","21 (واحد وعشرين)"],["Wie alt bist du?","قدّاش عمرك؟"],["Ich bin neunzehn Jahre alt.","عمري 19 سنة."]],note:"من 21 فما فوق نقولو الآحاد ثم und ثم العشرات: ein-und-zwanzig. العمر: Ich bin ... Jahre alt."},
{id:"a1-7",level:"A1",title:"أيام الأسبوع والوقت",subtitle:"الأيام، اليوم، وغدوة والبارح.",items:[["Montag","الإثنين"],["Dienstag","الثلاثاء"],["Mittwoch","الأربعاء"],["Donnerstag","الخميس"],["Freitag","الجمعة"],["Samstag / Sonnabend","السبت"],["Sonntag","الأحد"],["heute","اليوم"],["morgen","غدوة"],["gestern","البارح"],["Um acht Uhr","مع الثمانية"]],note:"أيام الأسبوع أسماء وتكتب بحرف كبير. للسؤال على الوقت: Wie spät ist es? وللموعد: um 8 Uhr."},
{id:"a1-8",level:"A1",title:"الأشهر والفصول والتاريخ",subtitle:"تقول تاريخ ميلادك وتسأل على الشهر.",items:[["Januar / Februar","جانفي / فيفري"],["März / April","مارس / أفريل"],["Mai / Juni","ماي / جوان"],["Juli / August","جويلية / أوت"],["September / Oktober","سبتمبر / أكتوبر"],["November / Dezember","نوفمبر / ديسمبر"],["der Frühling","الربيع"],["der Sommer","الصيف"],["der Herbst","الخريف"],["der Winter","الشتاء"],["Wann hast du Geburtstag?","وقتاش عيد ميلادك؟"]],note:"التاريخ غالباً: am + رقم ترتيبي + الشهر. مثال: Ich habe am 5. Mai Geburtstag."},
{id:"a1-9",level:"A1",title:"أدوات التعريف der / die / das",subtitle:"كل اسم عنده جنس نحوي في الألمانية.",items:[["der Mann","الرجل"],["die Frau","المرأة"],["das Kind","الطفل"],["der Tisch","الطاولة"],["die Lampe","المصباح"],["das Buch","الكتاب"],["die Bücher","الكتب (جمع)"],["ein Mann","رجل"],["eine Frau","امرأة"],["ein Kind","طفل"]],note:"احفظ كل اسم مع أداته: der أو die أو das. في الجمع أداة التعريف هي die. ein/eine أدوات نكرة."},
{id:"a1-10",level:"A1",title:"أدوات السؤال",subtitle:"اسأل على الاسم، المكان، الوقت والسبب.",items:[["Wer?","شكون؟"],["Was?","شنوّة؟"],["Wo?","وين؟"],["Woher?","منين؟"],["Wohin?","لوين؟"],["Wann?","وقتاش؟"],["Wie?","كيفاش؟"],["Warum?","علاش؟"],["Wie viel?","قدّاش؟"],["Welche Sprache?","أي لغة؟"]],note:"في سؤال بأداة استفهام يجي الفعل المصرف بعد أداة السؤال مباشرة: Wo wohnst du? = وين تسكن؟"},
{id:"a1-11",level:"A1",title:"الأفعال في الحاضر",subtitle:"تصريف الأفعال العادية مثل lernen وwohnen.",items:[["lernen","يتعلّم"],["ich lerne","أنا نتعلّم"],["du lernst","إنت تتعلّم"],["er lernt","هو يتعلّم"],["wir lernen","إحنا نتعلّمو"],["ihr lernt","إنتوما تتعلّمو"],["sie lernen","هما يتعلّمو"],["wohnen","يسكن"],["machen","يعمل"],["spielen","يلعب"]],note:"نحّيو -en من مصدر الفعل ونزيدو النهاية: e, st, t, en, t, en. مثال: ich mache, du machst."},
{id:"a1-12",level:"A1",title:"ترتيب الجملة والنفي",subtitle:"ركّب جملة بسيطة واستعمل nicht وkein.",items:[["Ich lerne Deutsch.","أنا نتعلّم الألمانية."],["Ahmed wohnt in Tunis.","أحمد يسكن في تونس."],["Heute lerne ich Deutsch.","اليوم نتعلّم الألمانية."],["Ich komme nicht.","أنا ما نجيش."],["Das ist kein Auto.","هاذي موش كرهبة."],["Ich habe keine Zeit.","ما عنديش وقت."],["nicht","موش / لا"],["kein / keine","ما فماش / ليس عندي"]],note:"في الجملة العادية الفعل المصرف في المرتبة الثانية. nicht ينفي الفعل أو الصفة؛ kein ينفي اسماً مع أداة نكرة."},
{id:"a1-13",level:"A1",title:"العائلة والملكية",subtitle:"احكي على عايلتك واستعمل mein وdein.",items:[["die Familie","العائلة"],["der Vater","الأب"],["die Mutter","الأم"],["der Bruder","الأخ"],["die Schwester","الأخت"],["die Eltern","الوالدين"],["mein Vater","أبي"],["meine Mutter","أمي"],["dein Bruder","أخوك"],["Das ist meine Familie.","هاذي عايلتي."]],note:"mein للمذكر والمحايد، meine للمؤنث والجمع في الحالة الأساسية. dein/deine معناها متاعك."},
{id:"a1-14",level:"A1",title:"البلدان واللغات",subtitle:"قول منين إنت وشنوّة اللغات اللي تحكيها.",items:[["Tunesien","تونس"],["Deutschland","ألمانيا"],["Frankreich","فرنسا"],["Ich komme aus Tunesien.","أنا من تونس."],["Woher kommst du?","منين إنت؟"],["Ich wohne in Tunis.","نسكن في تونس."],["Deutsch","الألمانية"],["Arabisch","العربية"],["Französisch","الفرنسية"],["Ich spreche Arabisch.","نحكي عربي."]],note:"aus تستعمل للأصل: aus Tunesien. in تستعمل للمكان اللي تسكن فيه: in Tunis. اللغات تكتب بحرف كبير."},
{id:"a1-15",level:"A1",title:"الأكل والشرب",subtitle:"اطلب ماكلة ومشروب في مقهى أو مطعم.",items:[["das Wasser","الماء"],["der Kaffee","القهوة"],["der Tee","الشاي"],["das Brot","الخبز"],["der Käse","الجبن"],["der Apfel","التفاح"],["Ich möchte Wasser.","نحب ماء."],["Ein Kaffee, bitte.","قهوة من فضلك."],["Die Rechnung, bitte.","الحساب من فضلك."],["lecker","بنينة"]],note:"Ich möchte ... صيغة مهذّبة للطلب. Bitte معناها من فضلك، Danke معناها شكراً."},
{id:"a1-16",level:"A1",title:"في السوق والتسوّق",subtitle:"اسأل على السعر والكمية.",items:[["Wie viel kostet das?","قدّاش يسوى هذا؟"],["Das kostet fünf Euro.","هذا يسوى خمسة أورو."],["billig","رخيص"],["teuer","غالي"],["der Preis","السعر"],["das Kilo","الكيلو"],["Ich nehme das.","ناخو هذا."],["Haben Sie ...?","عندكم ...؟"],["nur","فقط"],["zu teuer","غالي برشا"]],note:"في محلّ استعمل Sie مع البائع. Wie viel kostet ...? للسؤال على ثمن حاجة مفردة."},
{id:"a1-17",level:"A1",title:"البيت والغرف",subtitle:"سمّي غرف الدار والأثاث.",items:[["das Haus","الدار"],["die Wohnung","الشقة"],["das Zimmer","الغرفة"],["die Küche","الكوجينة"],["das Bad","الحمّام"],["das Schlafzimmer","بيت النوم"],["der Tisch","الطاولة"],["der Stuhl","الكرسي"],["das Bett","السرير"],["Meine Wohnung ist klein.","شقتي صغيرة."]],note:"الصفات بعد sein ما تتبدّلش حسب الجنس: Das Zimmer ist klein. Die Küche ist klein."},
{id:"a1-18",level:"A1",title:"المدينة والاتجاهات",subtitle:"اسأل على مكان وكيفاش توصللو.",items:[["die Stadt","المدينة"],["der Bahnhof","محطة القطار"],["die Schule","المدرسة"],["die Apotheke","الصيدلية"],["links","على اليسار"],["rechts","على اليمين"],["geradeaus","دغري"],["Wo ist der Bahnhof?","وين محطة القطار؟"],["Gehen Sie geradeaus.","امشي دغري."],["in der Nähe","قريب"]],note:"للتوجيه استعمل: Gehen Sie ... (امشي/امشيو). تنجم تقول Entschuldigung, wo ist ...? للاستئذان."},
{id:"a1-19",level:"A1",title:"النقل والسفر",subtitle:"احكي على وسائل النقل واشري تذكرة.",items:[["der Bus","الحافلة"],["der Zug","القطار"],["das Auto","السيارة"],["das Fahrrad","الدراجة"],["die Fahrkarte","التذكرة"],["einfach","ذهاب فقط"],["hin und zurück","ذهاب وإياب"],["Wann fährt der Zug?","وقتاش يخرج القطار؟"],["Ich fahre mit dem Bus.","نمشي بالحافلة."],["der Flughafen","المطار"]],note:"mit معناها بـ/مع، وبعدها الاسم غالباً ياخذ Dativ: mit dem Bus، mit der Bahn."},
{id:"a1-20",level:"A1",title:"الروتين اليومي",subtitle:"احكي على نهارك وأوقاتك.",items:[["aufstehen","يفيق من النوم"],["frühstücken","يفطر"],["arbeiten","يخدم"],["lernen","يقرا / يتعلّم"],["essen","ياكل"],["schlafen","يرقد"],["Ich stehe um sieben Uhr auf.","نفيق مع السبعة."],["Dann frühstücke ich.","بعد نفطر."],["Am Abend","في العشية"],["jeden Tag","كل يوم"]],note:"aufstehen فعل منفصل: auf + stehen. في الجملة المصرفة: Ich stehe früh auf. الجزء auf يجي في آخر الجملة."},
{id:"a1-21",level:"A1",title:"الهوايات ووقت الفراغ",subtitle:"قول شنوّة تحب تعمل في وقت الفراغ.",items:[["Musik hören","يسمع موسيقى"],["Fußball spielen","يلعب كرة"],["lesen","يقرا"],["schwimmen","يعوم"],["kochen","يطيب"],["tanzen","يرقص"],["Ich spiele gern Fußball.","نحب نلعب كرة."],["Was machst du gern?","شنوّة تحب تعمل؟"],["am Wochenende","في آخر الأسبوع"],["mein Hobby","هوايتي"]],note:"gern تجي بعد الفعل وتعني إنك تعمل الحاجة بحب: Ich lese gern. = نحب نقرا."},
{id:"a1-22",level:"A1",title:"الطقس والملابس",subtitle:"وصف الطقس واختيار اللبسة.",items:[["das Wetter","الطقس"],["Es ist warm.","الجو دافي."],["Es ist kalt.","الجو بارد."],["Es regnet.","تصبّ الشتا."],["die Sonne","الشمس"],["die Jacke","السترة"],["die Hose","السروال"],["das Hemd","القميص"],["die Schuhe","الصباط"],["Was ziehst du an?","شنوّة باش تلبس؟"]],note:"Es ist + صفة: Es ist sonnig (مشمس)، kalt (بارد)، warm (دافئ). الفعل anziehen منفصل: Ich ziehe eine Jacke an."},
{id:"a1-23",level:"A1",title:"الصحة والجسم",subtitle:"عبارات بسيطة للتعبير على الوجيعة وطلب المساعدة.",items:[["der Kopf","الرأس"],["der Bauch","البطن"],["der Rücken","الظهر"],["der Arzt / die Ärztin","الطبيب / الطبيبة"],["Ich bin krank.","أنا مريض."],["Ich habe Kopfschmerzen.","عندي وجيعة راس."],["Mir ist kalt.","حاسس بالبرد."],["Ich brauche einen Arzt.","نحتاج طبيب."],["Gute Besserung!","بالشفاء."],["die Apotheke","الصيدلية"]],note:"Ich habe + اسم الوجيعة: Ich habe Bauchschmerzen. في الحالات المستعجلة اطلب المساعدة من شخص بالغ أو الخدمات المحلية."},
{id:"a1-24",level:"A1",title:"مراجعة A1 ومحادثة كاملة",subtitle:"اربط المواضيع الكل في حوار قصير.",items:[["Guten Tag! Wie heißen Sie?","نهارك طيّب! شنوّة اسمك؟ (رسمي)"],["Ich heiße Sami. Und Sie?","اسمي سامي، وإنت؟"],["Ich heiße Anna. Woher kommen Sie?","اسمي آنا. منين إنت؟"],["Ich komme aus Deutschland.","أنا من ألمانيا."],["Wo wohnen Sie?","وين تسكن؟"],["Ich wohne in Tunis.","نسكن في تونس."],["Was machen Sie gern?","شنوّة تحب تعمل؟"],["Ich höre gern Musik.","نحب نسمع الموسيقى."],["Vielen Dank! Auf Wiedersehen!","شكراً برشا! إلى اللقاء!"]],note:"مراجعة A1: عرّف بروحك، اسأل على الاسم والأصل والسكن، استعمل sein/haben، وركّب جملة بسيطة. جرّب الحوار بصوت مرتفع."}
];
let state = JSON.parse(localStorage.getItem("dt_state") || '{"completed":[],"name":"","scores":[]}');
let currentLesson = lessons[0];
const $ = s => document.querySelector(s);
function save(){localStorage.setItem("dt_state",JSON.stringify(state));updateDashboard()}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2300)}
function renderCourses(){
 $("#courseGrid").innerHTML=courses.map(c=>`<article class="course-card"><div class="course-level">${c.level}</div><h3>${c.title}</h3><p>${c.desc}</p><div class="course-meta"><span>${c.lessons} درس مقترح</span><span>CEFR</span></div><button class="btn btn-outline" data-course="${c.level}">شوف الدروس ←</button></article>`).join("");
 document.querySelectorAll("[data-course]").forEach(b=>b.addEventListener("click",()=>{if(b.dataset.course==="A1"){renderLessonIndex();$("#lessonArea").scrollIntoView({behavior:"smooth"})}else toast("محتوى "+b.dataset.course+" الكامل قيد الإعداد. المستوى A1 فيه 24 درساً متوفّراً.")}));
}
function renderLessonIndex(){
 const old=$("#lessonIndex"); if(old) old.remove();
 const box=document.createElement("div"); box.id="lessonIndex"; box.className="lesson-index";
 box.innerHTML='<h3>برنامج A1 — 24 درس</h3><p>اختار الدرس اللي تحب تبدأ به. الدروس مرتّبة من الأساسيات إلى المحادثة.</p><div class="lesson-index-grid">'+lessons.map((l,i)=>`<button class="lesson-index-item ${state.completed.includes(l.id)?"done":""}" data-lesson-index="${i}"><span>${String(i+1).padStart(2,"0")}</span><b>${esc(l.title)}</b><small>${state.completed.includes(l.id)?"مكتمل ✓":"افتح الدرس"}</small></button>`).join("")+'</div>';
 $("#lessonArea").prepend(box);
 box.querySelectorAll("[data-lesson-index]").forEach(b=>b.onclick=()=>{loadLesson(lessons[Number(b.dataset.lessonIndex)]);$("#lessonContent").scrollIntoView({behavior:"smooth",block:"start"});});
}
function loadLesson(lesson){
 currentLesson=lesson;$("#lessonTitle").textContent=lesson.title;$("#lessonSubtitle").textContent=lesson.subtitle;$("#lessonLevel").textContent=lesson.level+" · Lektion";
 $("#lessonContent").innerHTML=lesson.items.map(([de,ar])=>`<div class="phrase"><div><b>${de}</b><small>${ar}</small></div><button class="audio-btn" data-say="${de.replace(/"/g,"&quot;")}">🔊 اسمع</button></div>`).join("")+`<div class="lesson-note"><b>ملاحظة:</b> ${lesson.note}</div>`;
 document.querySelectorAll("[data-say]").forEach(b=>b.addEventListener("click",()=>speak(b.dataset.say)));
 $("#completeLesson").textContent=state.completed.includes(lesson.id)?"الدرس مكتمل ✓":"علّم الدرس كمكتمل ✓";
 $("#completeLesson").onclick=()=>{if(!state.completed.includes(lesson.id))state.completed.push(lesson.id);save();saveLessonCloud(lesson.id);$("#completeLesson").textContent="الدرس مكتمل ✓";toast(currentUser?"تسجّل الدرس في حسابك!":"تسجّل الدرس على الجهاز. ادخل لحسابك للحفظ أونلاين.")};
}
function speak(text){if(!("speechSynthesis" in window)){toast("خاصية النطق موش متوفّرة في المتصفّح هذا.");return}let u=new SpeechSynthesisUtterance(text);u.lang="de-DE";speechSynthesis.cancel();speechSynthesis.speak(u)}
function updateDashboard(){
 const total=lessons.length,done=state.completed.filter(id=>lessons.some(l=>l.id===id)).length,pct=Math.round(done/total*100);
 $("#progressPercent").textContent=pct+"%";$("#progressBar").style.width=pct+"%";$("#progressText").textContent=done?`كمّلت ${done} من ${total} درس A1.`:"ما كملتش حتى درس. يلا نبدأو!";
 $("#welcomeName").textContent=state.name?`أهلا ${state.name}!`:"أهلا بيك!";
}
function renderExam(){
 const qs=[
 {q:"شنوّة معناها Guten Morgen؟",a:["تصبح على خير","صباح الخير","إلى اللقاء"],c:1},
 {q:"كمّل: Ich ___ Ahmed.",a:["bin","bist","sind"],c:0},
 {q:"شنوّة أداة التعريف الصحيحة مع Frau؟",a:["der","das","die"],c:2},
 {q:"كيفاش تقول 21 بالألماني؟",a:["zwölf","einundzwanzig","dreißig"],c:1},
 {q:"شنوّة معناها Woher kommst du؟",a:["وين تسكن؟","قدّاش عمرك؟","منين إنت؟"],c:2},
 {q:"كمّل: Wir ___ Deutsch.",a:["lernt","lernen","lernst"],c:1},
 {q:"شنوّة معناها Ich habe einen Bruder؟",a:["عندي أخ","أنا أخ","نحب أخ"],c:0},
 {q:"كيفاش تقول «على اليسار»؟",a:["rechts","links","geradeaus"],c:1}
 ];
 $("#examQuestions").innerHTML=qs.map((q,i)=>`<div class="question"><b>${i+1}. ${q.q}</b>${q.a.map((a,j)=>`<label><input type="radio" name="q${i}" value="${j}"> ${a}</label>`).join("")}</div>`).join("");
 $("#submitExam").onclick=()=>{let score=0,answered=0;qs.forEach((q,i)=>{let v=document.querySelector(`input[name="q${i}"]:checked`);if(v){answered++;if(+v.value===q.c)score++}});if(answered<qs.length){$("#examResult").textContent="جاوب على الأسئلة الكلّ قبل.";return}$("#examResult").textContent=`نتيجتك: ${score}/${qs.length} — ${score===3?"ممتاز!":score>=2?"باهي، واصل!":"عاود راجع الدرس وجرب مرة أخرى."}`;state.scores.push({date:new Date().toISOString(),score,total:qs.length});save();saveQuizCloud(score,qs.length)};
}
$("#profileButton").onclick=()=>{$("#studentName").value=state.name;showAuthState();$("#profileModal").hidden=false};
$("#closeModal").onclick=()=>$("#profileModal").hidden=true;
$("#signUpButton").onclick=()=>authAction('signup');
$("#signInButton").onclick=()=>authAction('signin');
$("#signOutButton").onclick=async()=>{await supabaseClient.auth.signOut();currentUser=null;showAuthState();toast('خرجت من الحساب.');};
$("#resetProgress").onclick=()=>{if(confirm("متأكد تحب تمسح التقدّم والنتائج من الجهاز هذا؟")){state.completed=[];state.scores=[];save();loadLesson(currentLesson);toast("تمّت إعادة ضبط التقدّم.")}};
$("#continueButton").onclick=()=>{$("#lessonArea").scrollIntoView({behavior:"smooth"})};
$("#quickQuiz").querySelectorAll("button").forEach(b=>b.onclick=()=>{document.querySelectorAll("#quickQuiz button").forEach(x=>x.classList.remove("selected","correct","wrong"));b.classList.add(b.dataset.correct==="true"?"correct":"wrong");$("#quickFeedback").textContent=b.dataset.correct==="true"?"صحيح! يعطيك الصحة.":"موش هاذي. جرّب مرّة أخرى.";});
$("#menuToggle").onclick=()=>$("#mainNav").classList.toggle("open");
$("#mainNav").querySelectorAll("a").forEach(a=>a.onclick=()=>$("#mainNav").classList.remove("open"));
$("#year").textContent=new Date().getFullYear();
renderCourses();loadLesson(lessons[0]);renderExam();updateDashboard();
supabaseClient.auth.getSession().then(async({data})=>{currentUser=data.session?.user||null;showAuthState();if(currentUser){await syncFromCloud();await refreshRole();}});
supabaseClient.auth.onAuthStateChange(async(_event,session)=>{currentUser=session?.user||null;showAuthState();if(currentUser){await syncFromCloud();await refreshRole();}else{currentRole='student';applyRoleUI();}});

$('#addLessonButton').onclick=async()=>{if(currentRole!=='admin'){toast('الصلاحية هاذي للمدير فقط.');return;}const id=$('#newLessonId').value.trim(),level=$('#newLessonLevel').value,title=$('#newLessonTitle').value.trim(),description=$('#newLessonDescription').value.trim();if(!id||!title){toast('اكتب معرّف الدرس والعنوان.');return;}const {error}=await supabaseClient.from('lessons').upsert({id,level,title,description,published:true,sort_order:99});if(error)toast('ما نجّمتش نضيف الدرس: '+error.message);else{toast('تضاف الدرس في قاعدة البيانات.');$('#newLessonId').value='';$('#newLessonTitle').value='';$('#newLessonDescription').value='';loadAdminPanel();}};
