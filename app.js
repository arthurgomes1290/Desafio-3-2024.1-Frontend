const urlApi = 'https://servicodados.ibge.gov.br/api/v1/localidades';

const botaoUf = document.getElementById('botao-uf');
const textoUf = document.getElementById('texto-uf-selecionada');
const painelUfs = document.getElementById('painel-ufs');
const listaUfs = document.getElementById('lista-ufs');
const totalCidades = document.getElementById('total-cidades');
const idUf = document.getElementById('id-uf');
const tituloTabela = document.getElementById('titulo-tabela');
const campoBusca = document.getElementById('campo-busca');
const corpoTabela = document.getElementById('corpo-tabela');
const estadoVazio = document.getElementById('estado-vazio');
const estadoVazioTitulo = document.getElementById('estado-vazio-titulo');
const estadoVazioTexto = document.getElementById('estado-vazio-texto');

let ufAtual = null;
let municipios = [];

async function buscarEstados() {
  const resposta = await axios.get(urlApi + '/estados?orderBy=nome');
  return resposta.data;
}

async function buscarMunicipios(sigla) {
  const resposta = await axios.get(urlApi + '/estados/' + sigla + '/municipios?orderBy=nome');
  return resposta.data;
}

function abrirAccordion() {
  painelUfs.hidden = false;
  botaoUf.classList.add('aberto');
}

function fecharAccordion() {
  painelUfs.hidden = true;
  botaoUf.classList.remove('aberto');
}

function mostrarEstados(estados) {
  listaUfs.innerHTML = '';

  for (const estado of estados) {
    const botao = document.createElement('button');
    botao.className = 'item-uf';
    botao.dataset.sigla = estado.sigla;
    botao.innerHTML = '<span class="item-uf-sigla">' + estado.sigla + '</span>' +
      '<span class="item-uf-nome">' + estado.nome + '</span>';

    botao.addEventListener('click', function () {
      selecionarUf(estado);
    });

    listaUfs.appendChild(botao);
  }
}

async function selecionarUf(estado) {
  ufAtual = estado;

  textoUf.textContent = estado.nome + ' (' + estado.sigla + ')';
  textoUf.classList.add('selecionado');

  const botoes = document.querySelectorAll('.item-uf');
  for (const botao of botoes) {
    if (botao.dataset.sigla === estado.sigla) {
      botao.classList.add('selecionado');
    } else {
      botao.classList.remove('selecionado');
    }
  }

  fecharAccordion();

  idUf.textContent = estado.id;
  totalCidades.textContent = '...';
  tituloTabela.textContent = 'Municípios de ' + estado.nome;
  campoBusca.value = '';
  campoBusca.disabled = true;
  mostrarMensagem('Carregando municípios...', 'Aguarde um pouco.');

  try {
    const lista = await buscarMunicipios(estado.sigla);

    if (ufAtual.sigla !== estado.sigla) {
      return;
    }

    municipios = lista;
    totalCidades.textContent = lista.length;
    campoBusca.disabled = false;
    mostrarTabela(lista);
  } catch (erro) {
    console.log(erro);
    municipios = [];
    totalCidades.textContent = 0;
    mostrarMensagem('Erro ao carregar os municípios.', 'Verifique sua internet e tente de novo.');
  }
}

function linkGoogleMaps(nomeMunicipio) {
  const busca = nomeMunicipio + ', ' + ufAtual.sigla + ', Brasil';
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(busca);
}

function mostrarTabela(lista) {
  if (lista.length === 0) {
    mostrarMensagem('Nenhum município encontrado.', 'Tente buscar outro nome.');
    return;
  }

  estadoVazio.hidden = true;

  let linhas = '';
  for (const municipio of lista) {
    linhas += '<tr>' +
      '<td class="codigo">' + municipio.id + '</td>' +
      '<td><a class="link-mapa" href="' + linkGoogleMaps(municipio.nome) + '" target="_blank">' + municipio.nome + '</a></td>' +
      '<td class="uf">' + ufAtual.sigla + '</td>' +
      '</tr>';
  }

  corpoTabela.innerHTML = linhas;
}

function mostrarMensagem(titulo, texto) {
  corpoTabela.innerHTML = '';
  estadoVazioTitulo.textContent = titulo;
  estadoVazioTexto.textContent = texto;
  estadoVazio.hidden = false;
}

function tirarAcentos(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function filtrarMunicipios() {
  const textoBusca = tirarAcentos(campoBusca.value.trim());

  const filtrados = municipios.filter(function (municipio) {
    return tirarAcentos(municipio.nome).includes(textoBusca);
  });

  mostrarTabela(filtrados);
}

botaoUf.addEventListener('click', function () {
  if (painelUfs.hidden) {
    abrirAccordion();
  } else {
    fecharAccordion();
  }
});

campoBusca.addEventListener('input', filtrarMunicipios);

buscarEstados()
  .then(mostrarEstados)
  .catch(function (erro) {
    console.log(erro);
    listaUfs.innerHTML = '<p class="mensagem-lista">Erro ao carregar os estados.</p>';
  });
