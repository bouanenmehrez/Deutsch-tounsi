const courses = [
 {level:"A1",title:"مبتدئ",desc:"الحروف، التحيات، التعارف، الأرقام والجمل البسيطة.",lessons:12,detail:"تتعلّم تقدّم روحك وتحكي على حياتك اليومية."},
 {level:"A2",title:"أساسي",desc:"الماضي، التسوّق، التنقّل، المواعيد والمحادثات اليومية.",lessons:16,detail:"توسّع مفرداتك وتفهم مواقف أكثر."},
 {level:"B1",title:"متوسّط",desc:"التعبير على الرأي، التجارب، العمل والدراسة.",lessons:20,detail:"تتعلّم تحكي باستقلالية في مواضيع مألوفة."},
 {level:"B2",title:"فوق المتوسّط",desc:"نقاشات، نصوص أطول، حجج وتحضير متقدّم.",lessons:20,detail:"تطوّر الفهم والتعبير بمستوى أعمق."}
];
const lessons = [
 {id:"a1-1",level:"A1",title:"التحيات والتعارف",subtitle:"أهمّ العبارات اللي تستعملهم كي تقابل شخص بالألماني.",items:[["Hallo!","أهلا / سلام"],["Guten Morgen!","صباح الخير"],["Wie heißt du?","شنوّة اسمك؟"],["Ich heiße …","اسمي …"],["Auf Wiedersehen!","إلى اللقاء"]],note:"في الألماني، الحرف الأول من الأسماء يكتب كبير."},
 {id:"a1-2",level:"A1",title:"الفعل sein (يكون)",subtitle:"الفعل sein من أهمّ الأفعال في اللغة الألمانية.",items:[["Ich bin","أنا نكون / أنا"],["Du bist","إنت تكون"],["Er ist","هو يكون"],["Sie ist","هي تكون"],["Wir sind","إحنا نكونو"],["Ihr seid","إنتوما تكونو"],["Sie sind","هما / حضرتك"]],note:"مثال: Ich bin Ahmed = أنا أحمد. الفعل يتبدّل حسب الضمير."},
 {id:"a1-3",level:"A1",title:"الأرقام من 0 إلى 10",subtitle:"احفظ الأرقام الأولى واستعملهم في العمر ورقم الهاتف.",items:[["null — 0","صفر"],["eins — 1","واحد"],["zwei — 2","اثنين"],["drei — 3","ثلاثة"],["vier — 4","أربعة"],["fünf — 5","خمسة"],["sechs — 6","ستة"],["sieben — 7","سبعة"],["acht — 8","ثمانية"],["neun — 9","تسعة"],["zehn — 10","عشرة"]],note:"Ich bin 19 Jahre alt = عمري 19 سنة."},
 {id:"a1-4",level:"A1",title:"أدوات التعريف der / die / das",subtitle:"في الألمانية كل اسم عندو جنس نحوي.",items:[["der Mann","الرجل — مذكّر"],["die Frau","المرأة — مؤنّث"],["das Kind","الطفل — محايد"],["die Bücher","الكتب — جمع"]],note:"احفظ الاسم مع أداة التعريف متاعو: der Tisch، die Lampe، das Buch."},
 {id:"a1-5",level:"A1",title:"ترتيب الجملة البسيطة",subtitle:"في الجملة الخبرية العادية، الفعل المصرف يجي غالباً في المرتبة الثانية.",items:[["Ich lerne Deutsch.","أنا نتعلّم الألمانية."],["Ahmed wohnt in Tunis.","أحمد يسكن في تونس."],["Wir spielen Fußball.","إحنا نلعبو كرة القدم."]],note:"مثال: Heute lerne ich Deutsch. (اليوم نتعلّم الألمانية) الفعل يبقى في المرتبة الثانية."},
 {id:"a1-6",level:"A1",title:"العائلة",subtitle:"كلمات أساسية باش تحكي على عايلتك.",items:[["die Familie","العائلة"],["der Vater","الأب"],["die Mutter","الأم"],["der Bruder","الأخ"],["die Schwester","الأخت"],["die Eltern","الوالدين"]],note:"Das ist meine Familie = هاذي عايلتي."}
];
let state = JSON.parse(localStorage.getItem("dt_state") || '{"completed":[],"name":"","scores":[]}');
let currentLesson = lessons[0];
const $ = s => document.querySelector(s);
function save(){localStorage.setItem("dt_state",JSON.stringify(state));updateDashboard()}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2300)}
function renderCourses(){
 $("#courseGrid").innerHTML=courses.map(c=>`<article class="course-card"><div class="course-level">${c.level}</div><h3>${c.title}</h3><p>${c.desc}</p><div class="course-meta"><span>${c.lessons} درس مقترح</span><span>CEFR</span></div><button class="btn btn-outline" data-course="${c.level}">شوف الدروس ←</button></article>`).join("");
 document.querySelectorAll("[data-course]").forEach(b=>b.addEventListener("click",()=>{if(b.dataset.course==="A1"){loadLesson(lessons[0]);$("#lessonArea").scrollIntoView()}else toast("دروس "+b.dataset.course+" قيد الإعداد — تنجم تستعمل المصادر المجانية حالياً.")}));
}
function loadLesson(lesson){
 currentLesson=lesson;$("#lessonTitle").textContent=lesson.title;$("#lessonSubtitle").textContent=lesson.subtitle;$("#lessonLevel").textContent=lesson.level+" · Lektion";
 $("#lessonContent").innerHTML=lesson.items.map(([de,ar])=>`<div class="phrase"><div><b>${de}</b><small>${ar}</small></div><button class="audio-btn" data-say="${de.replace(/"/g,"&quot;")}">🔊 اسمع</button></div>`).join("")+`<div class="lesson-note"><b>ملاحظة:</b> ${lesson.note}</div>`;
 document.querySelectorAll("[data-say]").forEach(b=>b.addEventListener("click",()=>speak(b.dataset.say)));
 $("#completeLesson").textContent=state.completed.includes(lesson.id)?"الدرس مكتمل ✓":"علّم الدرس كمكتمل ✓";
 $("#completeLesson").onclick=()=>{if(!state.completed.includes(lesson.id))state.completed.push(lesson.id);save();$("#completeLesson").textContent="الدرس مكتمل ✓";toast("يعطيك الصحة! تسجّل الدرس كمكتمل.")};
}
function speak(text){if(!("speechSynthesis" in window)){toast("خاصية النطق موش متوفّرة في المتصفّح هذا.");return}let u=new SpeechSynthesisUtterance(text);u.lang="de-DE";speechSynthesis.cancel();speechSynthesis.speak(u)}
function updateDashboard(){
 const total=lessons.length,done=state.completed.length,pct=Math.round(done/total*100);
 $("#progressPercent").textContent=pct+"%";$("#progressBar").style.width=pct+"%";$("#progressText").textContent=done?`كمّلت ${done} من ${total} دروس A1 المتوفّرين حالياً.`:"ما كملتش حتى درس. يلا نبدأو!";
 $("#welcomeName").textContent=state.name?`أهلا ${state.name}!`:"أهلا بيك!";
}
function renderExam(){
 const qs=[{q:"شنوّة معناها Guten Morgen؟",a:["تصبح على خير","صباح الخير","إلى اللقاء"],c:1},{q:"كمّل: Ich ___ Ahmed.",a:["bin","bist","sind"],c:0},{q:"شنوّة أداة التعريف الصحيحة مع Frau؟",a:["der","das","die"],c:2}];
 $("#examQuestions").innerHTML=qs.map((q,i)=>`<div class="question"><b>${i+1}. ${q.q}</b>${q.a.map((a,j)=>`<label><input type="radio" name="q${i}" value="${j}"> ${a}</label>`).join("")}</div>`).join("");
 $("#submitExam").onclick=()=>{let score=0,answered=0;qs.forEach((q,i)=>{let v=document.querySelector(`input[name="q${i}"]:checked`);if(v){answered++;if(+v.value===q.c)score++}});if(answered<qs.length){$("#examResult").textContent="جاوب على الأسئلة الكلّ قبل.";return}$("#examResult").textContent=`نتيجتك: ${score}/${qs.length} — ${score===3?"ممتاز!":score>=2?"باهي، واصل!":"عاود راجع الدرس وجرب مرة أخرى."}`;state.scores.push({date:new Date().toISOString(),score,total:qs.length});save()};
}
$("#profileButton").onclick=()=>{$("#studentName").value=state.name;$("#profileModal").hidden=false};
$("#closeModal").onclick=()=>$("#profileModal").hidden=true;
$("#saveProfile").onclick=()=>{state.name=$("#studentName").value.trim();save();$("#profileModal").hidden=true;toast("تحفظ الاسم بنجاح!")};
$("#resetProgress").onclick=()=>{if(confirm("متأكد تحب تمسح التقدّم والنتائج من الجهاز هذا؟")){state.completed=[];state.scores=[];save();loadLesson(currentLesson);toast("تمّت إعادة ضبط التقدّم.")}};
$("#continueButton").onclick=()=>{$("#lessonArea").scrollIntoView({behavior:"smooth"})};
$("#quickQuiz").querySelectorAll("button").forEach(b=>b.onclick=()=>{document.querySelectorAll("#quickQuiz button").forEach(x=>x.classList.remove("selected","correct","wrong"));b.classList.add(b.dataset.correct==="true"?"correct":"wrong");$("#quickFeedback").textContent=b.dataset.correct==="true"?"صحيح! يعطيك الصحة.":"موش هاذي. جرّب مرّة أخرى.";});
$("#menuToggle").onclick=()=>$("#mainNav").classList.toggle("open");
$("#mainNav").querySelectorAll("a").forEach(a=>a.onclick=()=>$("#mainNav").classList.remove("open"));
$("#year").textContent=new Date().getFullYear();
renderCourses();loadLesson(lessons[0]);renderExam();updateDashboard();
