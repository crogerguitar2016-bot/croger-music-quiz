'use strict';
const TONALIDADES=[
 {nome:'Dó',acordes:['Dó','Ré menor','Mi menor','Fá','Sol','Lá menor','Si diminuto'],sig:['C','Dm','Em','F','G','Am','B°']},
 {nome:'Sol',acordes:['Sol','Lá menor','Si menor','Dó','Ré','Mi menor','Fá♯ diminuto'],sig:['G','Am','Bm','C','D','Em','F♯°']},
 {nome:'Ré',acordes:['Ré','Mi menor','Fá♯ menor','Sol','Lá','Si menor','Dó♯ diminuto'],sig:['D','Em','F♯m','G','A','Bm','C♯°']},
 {nome:'Lá',acordes:['Lá','Si menor','Dó♯ menor','Ré','Mi','Fá♯ menor','Sol♯ diminuto'],sig:['A','Bm','C♯m','D','E','F♯m','G♯°']},
 {nome:'Mi',acordes:['Mi','Fá♯ menor','Sol♯ menor','Lá','Si','Dó♯ menor','Ré♯ diminuto'],sig:['E','F♯m','G♯m','A','B','C♯m','D♯°']},
 {nome:'Si',acordes:['Si','Dó♯ menor','Ré♯ menor','Mi','Fá♯','Sol♯ menor','Lá♯ diminuto'],sig:['B','C♯m','D♯m','E','F♯','G♯m','A♯°']},
 {nome:'Fá♯',acordes:['Fá♯','Sol♯ menor','Lá♯ menor','Si','Dó♯','Ré♯ menor','Mi♯ diminuto'],sig:['F♯','G♯m','A♯m','B','C♯','D♯m','E♯°']}
];
const BLOCOS=[{nome:'I e IV',graus:[0,3]},{nome:'I e V',graus:[0,4]},{nome:'I, IV e V',graus:[0,3,4]},{nome:'I, V, VI e IV',graus:[0,4,5,3]}];
const ROMANOS=['I','II','III','IV','V','VI','VII'];
const $=id=>document.getElementById(id);
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const load=()=>{try{return JSON.parse(localStorage.getItem('crogerQuizRecords')||'[]')}catch{return []}};
const save=records=>localStorage.setItem('crogerQuizRecords',JSON.stringify(records));
let student=null,mode='avaliacao',block=0,questions=[],idx=0,score=0,started=0,answered=false,lastResult=null,respostasDetalhadas=[];
function show(id){['welcome','dashboard','study','exam','results','ranking','admin','professorLogin','professorPainel'].forEach(x=>$(x).classList.toggle('hidden',x!==id));window.scrollTo(0,0)}
function shuffle(a){const x=[...a];for(let i=x.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x}
function makeQuestions(b){return TONALIDADES.flatMap(t=>BLOCOS[b].graus.map(g=>({ton:t.nome,degree:ROMANOS[g],correct:t.acordes[g],options:shuffle([t.acordes[g],...shuffle(t.acordes.filter((_,i)=>i!==g)).slice(0,3)])})))}
function blocksUI(){const records=load().filter(r=>r.studentId===student.id&&r.mode==='avaliacao');$('blocks').innerHTML=BLOCOS.map((b,i)=>{let r=records.find(x=>x.block===i);return `<div class="card tile"><h3>Bloco ${i+1}</h3><p>${escapeHtml(b.nome)}</p><p class="small muted">${b.graus.length*7} perguntas</p><p>${r?`Primeira avaliação: <strong>${r.score}/${r.total}</strong>`:'Ainda não avaliado'}</p><button data-block="${i}">Iniciar bloco</button></div>`}).join('');document.querySelectorAll('[data-block]').forEach(b=>b.onclick=()=>startBlock(Number(b.dataset.block)))}
function dashboard(){if(!student)return show('welcome');$('greeting').textContent=`Olá, ${student.name} — ${student.instrument}`;blocksUI();show('dashboard')}
function startBlock(i){block=i;questions=makeQuestions(i);idx=0;score=0;respostasDetalhadas=[];started=Date.now();answered=false;renderQuestion();show('exam')}
function renderQuestion(){answered=false;let q=questions[idx];$('examMeta').textContent=`${mode==='estudo'?'Modo Estudo':'Modo Avaliação'} • Bloco ${block+1} • Questão ${idx+1} de ${questions.length}`;$('question').textContent=`Qual é o acorde do grau ${q.degree} no campo harmônico de ${q.ton} maior?`;$('bar').style.width=`${idx/questions.length*100}%`;$('feedback').classList.add('hidden');$('next').classList.add('hidden');$('choices').innerHTML='';q.options.forEach((opt,i)=>{const btn=document.createElement('button');btn.className='option';btn.textContent=`${String.fromCharCode(65+i)}. ${opt}`;btn.onclick=()=>choose(opt);$('choices').appendChild(btn)})}
function choose(opt){if(answered)return;answered=true;let q=questions[idx],ok=opt===q.correct;if(ok)score++;
respostasDetalhadas.push({
  numero:idx+1,
  bloco:block+1,
  pergunta:`Qual é o acorde do grau ${q.degree} no campo harmônico de ${q.ton} maior?`,
  alternativa_marcada:opt,
  resposta_correta:q.correct,
  acertou:ok
});
document.querySelectorAll('.option').forEach(b=>{b.disabled=true;let text=b.textContent.slice(3);if(text===q.correct)b.classList.add('correct');else if(text===opt)b.classList.add('wrong')});$('feedback').classList.remove('hidden');$('feedback').textContent=(ok?'✓ Resposta correta! ':'✗ Resposta incorreta. ')+`O grau ${q.degree} do campo harmônico de ${q.ton} maior é ${q.correct}.`;$('next').textContent=idx===questions.length-1?'Concluir bloco':'Próxima pergunta';$('next').classList.remove('hidden')}

async function salvarAvaliacaoSupabase(resultado){
  if(resultado.mode!=='avaliacao')return;

  const alunoId=student.supabaseId;
  if(!alunoId)throw new Error('Aluno sem identidade Supabase');

  const {error}=await crogerSupabase
    .from('avaliacoes')
    .insert({
      aluno_id:alunoId,
      nome_aluno:resultado.name,
      instrumento:resultado.instrument,
      bloco:resultado.block,
      modo:'avaliacao',
      pontos:resultado.score,
      total_questoes:resultado.total,
      tempo_segundos:resultado.seconds,
      respostas:resultado.respostas
    });

  if(error){
    if(error.code==='23505'){
      return false;
    }
    throw error;
  }
  return true;
}

async function finish(){
  const result={
    studentId:student.id,
    name:student.name,
    instrument:student.instrument,
    block,
    mode,
    score,
    total:questions.length,
    seconds:Math.round((Date.now()-started)/1000),
    respostas:respostasDetalhadas.map(r=>({...r})),
    date:new Date().toISOString()
  };

  lastResult=result;

  let mensagem='';

  if(mode==='avaliacao'){
    let records=load();

    const jaExiste=records.some(r=>
      r.studentId===student.id &&
      r.mode==='avaliacao' &&
      r.block===block
    );

    if(!jaExiste){
      records.push(result);
      save(records);
    }

    try{
      const enviado=await salvarAvaliacaoSupabase(result);
      mensagem=enviado
        ? 'Avaliação sincronizada com Supabase.'
        : 'A primeira avaliação deste bloco já está registrada no Supabase.';
    }catch(erro){
      console.error(erro);
      mensagem='Resultado salvo localmente. Sincronização pendente. Erro: '+escapeHtml(erro.message||String(erro));
    }
  }

  $('resultText').innerHTML=
    `<p><strong>${escapeHtml(student.name)}</strong> — ${escapeHtml(student.instrument)}</p>`+
    `<p><strong>${score} de ${questions.length}</strong> respostas corretas (${Math.round(score/questions.length*100)}%).</p>`+
    `<p>Tempo: ${result.seconds} segundos.</p>`+
    `<p class="muted small">${mode==='estudo'?'Modo Estudo: não altera o ranking.':mensagem}</p>`;

  $('certificate').classList.add('hidden');
  $('bar').style.width='100%';
  show('results');
}
function table(headers,rows){return `<table><thead><tr>${headers.map(x=>`<th>${escapeHtml(x)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(x=>`<td>${escapeHtml(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`}
function grouped(){const by=new Map();load().filter(r=>r.mode==='avaliacao').forEach(r=>{if(!by.has(r.studentId))by.set(r.studentId,{name:r.name,instrument:r.instrument,score:0,total:0,blocks:0});let s=by.get(r.studentId);s.score+=r.score;s.total+=r.total;s.blocks++});return [...by.values()].sort((a,b)=>(b.total?b.score/b.total:0)-(a.total?a.score/a.total:0)||b.score-a.score)}

async function ranking(){
  $('rankTable').innerHTML='<p>Carregando ranking...</p>';
  show('ranking');

  try{
    const {data,error}=await crogerSupabase.rpc(
      'ranking_por_instrumento',
      {p_instrumento:student.instrument}
    );

    if(error)throw error;

    const rows=(data||[]).map((r,i)=>[
      String(i+1),
      r.nome_aluno,
      r.instrumento,
      `${r.pontos}/${r.total_questoes}`,
      `${r.total_questoes?Math.round(100*r.pontos/r.total_questoes):0}%`,
      `${r.blocos}/4`
    ]);

    $('rankTable').innerHTML=
      `<h3>Ranking experimental — ${escapeHtml(student.instrument)}</h3>`+
      table(
        ['Posição','Aluno','Instrumento','Acertos','Aproveitamento','Blocos'],
        rows
      );

  }catch(erro){
    console.error(erro);

    const rows=grouped()
      .filter(r=>r.instrument===student.instrument)
      .map((r,i)=>[
        String(i+1),
        r.name,
        r.instrument,
        `${r.score}/${r.total}`,
        `${r.total?Math.round(100*r.score/r.total):0}%`,
        `${r.blocks}/4`
      ]);

    $('rankTable').innerHTML=
      `<h3>Ranking local — ${escapeHtml(student.instrument)}</h3>`+
      table(
        ['Posição','Aluno','Instrumento','Acertos','Aproveitamento','Blocos'],
        rows
      );
  }
}
function admin(){let rows=load().map(r=>[r.name,r.instrument,String(r.block+1),r.mode,`${r.score}/${r.total}`,new Date(r.date).toLocaleString('pt-BR')]);$('adminTable').innerHTML=table(['Aluno','Instrumento','Bloco','Modo','Resultado','Data'],rows);show('admin')}
function certificate(){if(!lastResult)return;let r=lastResult;if(r.mode!=='avaliacao'||r.score/r.total<.7){alert('O certificado demonstrativo requer ao menos 70% de acertos em uma avaliação.');return}const c=$('certificate');c.classList.remove('hidden');c.innerHTML=`<h2>Certificado de aproveitamento</h2><p>Oficina Musical Acordes</p><p>Certificamos que <strong>${escapeHtml(r.name)}</strong> concluiu o Bloco ${r.block+1} de Campos Harmônicos com aproveitamento de <strong>${Math.round(r.score/r.total*100)}%</strong>.</p><p>Diretor: Pastor Carlos Rogério</p><p>Secretária: Nazaré Maria</p><p class="small">Documento demonstrativo, sem validação institucional.</p><button class="noprint" onclick="window.print()">Imprimir / Salvar PDF</button>`}
function csvExport(){let rows=[['Aluno','Instrumento','Bloco','Modo','Acertos','Total','Data'],...load().map(r=>[r.name,r.instrument,String(r.block+1),r.mode,String(r.score),String(r.total),r.date])];let csv='\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\r\n');let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='croger_resultados_locais.csv';a.click();URL.revokeObjectURL(a.href)}

let profAvaliacoes = [];

function mostrarProfessor(id) {
  ['welcome','dashboard','study','exam','results',
   'ranking','admin','professorLogin','professorPainel']
    .forEach(x => {
      const el = $(x);
      if (el) el.classList.toggle('hidden', x !== id);
    });
  window.scrollTo(0,0);
}

async function abrirAreaProfessor() {
  mostrarProfessor('professorLogin');
  $('profMensagem').textContent = '';
}

async function entrarProfessor() {
  const botao = $('profEntrar');
  if (botao.disabled) return;
  botao.disabled = true;
  $('profMensagem').textContent = 'Verificando acesso...';

  try {
    await autenticarProfessor(
      $('profEmail').value.trim(),
      $('profSenha').value
    );
    $('profSenha').value = '';
    await carregarAvaliacoesProfessor();
  } catch (erro) {
    $('profMensagem').textContent =
      'Não foi possível entrar. Verifique as credenciais e a autorização.';
    console.error('Login administrativo:', erro.message);
  } finally {
    botao.disabled = false;
  }
}

async function carregarAvaliacoesProfessor() {
  const {data, error} = await crogerProfessorSupabase
    .from('avaliacoes')
    .select('*')
    .order('criado_em', {ascending:false})
    .limit(1000);

  if (error) throw error;

  profAvaliacoes = data || [];
  mostrarProfessor('professorPainel');
  desenharProfessor();
}

function desenharProfessor() {
  const lista = profAvaliacoes;
  const alunos = new Set(lista.map(r => r.aluno_id));

  $('profResumo').innerHTML = [
    ['Alunos', alunos.size],
    ['Avaliações', lista.length],
    ['Instrumentos', new Set(lista.map(r => r.instrumento)).size],
    ['Média', lista.length
      ? Math.round(lista.reduce((s,r) =>
          s + (Number(r.pontos)||0) /
          (Number(r.total_questoes)||1)*100,0)/lista.length)+'%'
      : '—']
  ].map(([nome,valor]) =>
    `<div class="prof-stat"><span>${nome}</span><strong>${valor}</strong></div>`
  ).join('');

  const busca = $('profBusca').value.toLocaleLowerCase('pt-BR');

  const filtradas = lista.filter(r =>
    String(r.nome_aluno||'').toLocaleLowerCase('pt-BR').includes(busca) ||
    String(r.instrumento||'').toLocaleLowerCase('pt-BR').includes(busca)
  );

  $('profStatus').textContent =
    `${filtradas.length} avaliação(ões) encontrada(s).`;

  $('profLista').innerHTML = filtradas.map((r) => {
    const i = lista.indexOf(r);
    const pontos = Number(r.pontos)||0;
    const total = Number(r.total_questoes)||0;
    return `<div class="prof-item">
      <strong>${escapeHtml(r.nome_aluno||'Aluno')}</strong>
      <p class="prof-small">${escapeHtml(r.instrumento||'')} •
      Bloco ${Number(r.bloco)+1}</p>
      <strong>${pontos}/${total}</strong>
      <button type="button" data-prof="${i}">
        Ver respostas
      </button>
    </div>`;
  }).join('') || '<p>Nenhuma avaliação encontrada.</p>';

  document.querySelectorAll('[data-prof]').forEach(btn => {
    btn.onclick = () => detalhesProfessor(Number(btn.dataset.prof));
  });
}

function detalhesProfessor(i) {
  const r = profAvaliacoes[i];
  if (!r) return;

  const respostas = Array.isArray(r.respostas) ? r.respostas : [];

  $('profDetalhes').innerHTML =
    `<div class="card">
      <h2>Respostas de ${escapeHtml(r.nome_aluno||'Aluno')}</h2>
      <p>Bloco ${Number(r.bloco)+1} •
      ${Number(r.pontos)||0}/${Number(r.total_questoes)||0}</p>
      ${respostas.length ? respostas.map(q =>
        `<div class="prof-detail ${q.acertou?'prof-ok':'prof-erro'}">
          <strong>Questão ${Number(q.numero)||0}</strong>
          <p>${escapeHtml(q.pergunta||'')}</p>
          <p>Marcada: ${escapeHtml(q.alternativa_marcada||'')}</p>
          <p>Correta: ${escapeHtml(q.resposta_correta||'')}</p>
          <strong>${q.acertou?'Acertou':'Errou'}</strong>
        </div>`
      ).join('') :
      '<p>Esta avaliação foi registrada antes da implantação do histórico de respostas.</p>'}
    </div>`;

  $('profDetalhes').scrollIntoView({behavior:'smooth'});
}

function iniciarInterfaceProfessor() {
  const botao = document.createElement('button');
  botao.textContent = '🔒 Área do Professor';
  botao.className = 'secondary';
  botao.type = 'button';
  botao.onclick = abrirAreaProfessor;

  const entrada = $('enter');
  entrada.parentElement.appendChild(botao);

  $('profEntrar').onclick = entrarProfessor;
  $('profVoltar').onclick = () => show('welcome');
  $('profBusca').oninput = desenharProfessor;

  $('profSair').onclick = async () => {
    try {
      await sairProfessor();
      profAvaliacoes = [];
      $('profDetalhes').innerHTML = '';
      $('profEmail').value = '';
      $('profSenha').value = '';
      show('welcome');
    } catch (erro) {
      $('profStatus').textContent = 'Não foi possível encerrar a sessão.';
    }
  };
}

function init(){let header=['Campo',...ROMANOS],rows=TONALIDADES.map(t=>[t.nome,...t.sig]);$('studyTable').innerHTML=table(header,rows);$('enter').onclick=async()=>{
const botao=$('enter');
if(botao.disabled)return;

const name=$('student').value.trim();
const instrument=$('instrument').value;

if(name.length<2||!instrument){
alert('Informe seu nome e instrumento.');
return;
}

botao.disabled=true;

try{
const supabaseId=await autenticarAluno();

student={
name,
instrument,
id:name.toLocaleLowerCase('pt-BR')
.normalize('NFD')
.replace(/[\u0300-\u036f]/g,'')
.replace(/\s+/g,' ')
.trim()+'|'+instrument,
supabaseId
};

dashboard();

}catch(erro){
console.error('Falha na autenticacao:',erro);
alert('Nao foi possivel autenticar o aluno. Verifique sua conexao e tente novamente.');
}finally{
botao.disabled=false;
}
};$('studyBtn').onclick=()=>show('study');$('examBtn').onclick=()=>{mode='avaliacao';dashboard()};$('studyBtn').onclick=()=>{mode='estudo';show('study')};$('backStudy').onclick=dashboard;$('rankingBtn').onclick=ranking;$('adminBtn').onclick=admin;$('logoutBtn').onclick=()=>{student=null;show('welcome')};$('backRank').onclick=dashboard;$('backAdmin').onclick=dashboard;$('next').onclick=()=>{idx++;idx<questions.length?renderQuestion():finish()};$('quit').onclick=()=>{if(confirm('Sair deste bloco? O progresso atual não será salvo.'))dashboard()};$('toDash').onclick=dashboard;$('certificateBtn').onclick=certificate;$('exportCsv').onclick=csvExport}
iniciarInterfaceProfessor();
init();
