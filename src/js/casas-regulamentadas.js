// Casas Regulamentadas - Sistema de Consulta
class CasasRegulamentadas {
  constructor() {
    this.dados = [];
    this.dadosFiltrados = [];
    this.marcasSet = new Set();
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    
    this.carregarDados();
    this.initialized = true;
    
    console.log('CasasRegulamentadas controller inicializado');
  }

  onPageActivated() {
    const container = document.querySelector('#casas-content');
    if (container && !container.innerHTML.trim()) {
      this.render();
      this.bindEvents();
      this.popularFiltroMarcas();
      this.filtrarDados();
    }
  }

  carregarDados() {
    // AQUI VOCÊ PODE ADICIONAR OS DADOS DAS CASAS REGULAMENTADAS
    // Estrutura de exemplo - substitua pelos dados reais
    const dadosManuais = [
      {req:"0001/2024",portaria:"SPA/MF nº 246, de 07/02/2025",empresa:"KAIZEN GAMING BRASIL LTDA",cnpj:"46.786.961/0001-74",marca:"BETANO",dominio:"betano.bet.br"},
    {req:"0002/2024",portaria:"SPA/MF nº 2.090, de 30/12/2024",empresa:"SPRBT INTERACTIVE BRASIL LTDA",cnpj:"54.071.596/0001-40",marca:"SUPERBET",dominio:"superbet.bet.br"},
    {req:"0002/2024",portaria:"SPA/MF nº 2.090, de 30/12/2024",empresa:"SPRBT INTERACTIVE BRASIL LTDA",cnpj:"54.071.596/0001-40",marca:"MAGICJACKPOT",dominio:"magicjackpot.bet.br"},
    {req:"0002/2024",portaria:"SPA/MF nº 2.090, de 30/12/2024",empresa:"SPRBT INTERACTIVE BRASIL LTDA",cnpj:"54.071.596/0001-40",marca:"SUPER",dominio:"super.bet.br"},

    {req:"0003/2024",portaria:"SPA/MF nº 2.091, de 30/12/2024 (alt. Port. 1.142, 23/05/2025)",empresa:"MMD TECNOLOGIA, ENTRETENIMENTO E MARKETING LTDA",cnpj:"34.935.286/0001-19",marca:"REI DO PITACO",dominio:"reidopitaco.bet.br"},
    {req:"0003/2024",portaria:"SPA/MF nº 2.091, de 30/12/2024 (alt. Port. 1.142, 23/05/2025)",empresa:"MMD TECNOLOGIA, ENTRETENIMENTO E MARKETING LTDA",cnpj:"34.935.286/0001-19",marca:"PITACO",dominio:"pitaco.bet.br"},
    {req:"0003/2024",portaria:"SPA/MF nº 2.091, de 30/12/2024 (alt. Port. 1.142, 23/05/2025)",empresa:"MMD TECNOLOGIA, ENTRETENIMENTO E MARKETING LTDA",cnpj:"34.935.286/0001-19",marca:"RdP",dominio:"rdp.bet.br"},

    {req:"0004/2024",portaria:"SPA/MF nº 247, de 07/02/2025",empresa:"VENTMEAR BRASIL S.A.",cnpj:"52.868.380/0001-84",marca:"SPORTINGBET",dominio:"sportingbet.bet.br"},
    {req:"0004/2024",portaria:"SPA/MF nº 247, de 07/02/2025",empresa:"VENTMEAR BRASIL S.A.",cnpj:"52.868.380/0001-84",marca:"BETBOO",dominio:"betboo.bet.br"},

    {req:"0005/2024",portaria:"SPA/MF nº 370, de 24/02/2025 (alt. 479/10-03-2025 e 755/08-04-2025)",empresa:"BIG BRAZIL TECNOLOGIA E LOTERIA S.A.",cnpj:"41.590.869/0001-10",marca:"BIG",dominio:"big.bet.br"},
    {req:"0005/2024",portaria:"SPA/MF nº 370, de 24/02/2025 (alt. 479/10-03-2025 e 755/08-04-2025)",empresa:"BIG BRAZIL TECNOLOGIA E LOTERIA S.A.",cnpj:"41.590.869/0001-10",marca:"APOSTAR",dominio:"apostar.bet.br"},
    {req:"0005/2024",portaria:"SPA/MF nº 370, de 24/02/2025 (alt. 479/10-03-2025 e 755/08-04-2025)",empresa:"BIG BRAZIL TECNOLOGIA E LOTERIA S.A.",cnpj:"41.590.869/0001-10",marca:"CAESARS",dominio:"caesars.bet.br"},

    {req:"0006/2024",portaria:"SPA/MF nº 2.092, de 30/12/2024 (alt. 1.814, 15/08/2025)",empresa:"NSX BRASIL S.A.",cnpj:"55.056.104/0001-00",marca:"BETNACIONAL",dominio:"betnacional.bet.br"},

    {req:"0007/2024",portaria:"SPA/MF nº 2.093, de 30/12/2024",empresa:"APOLLO OPERATIONS LTDA",cnpj:"54.923.003/0001-26",marca:"KTO",dominio:"kto.bet.br"},

    {req:"0008/2024",portaria:"SPA/MF nº 371, de 24/02/2025",empresa:"SIMULCASTING BRASIL SOM E IMAGEM S.A.",cnpj:"17.385.948/0001-05",marca:"BETSSON",dominio:"betsson.bet.br"},

    {req:"0009/2024",portaria:"SPA/MF nº 2.094, de 30/12/2024",empresa:"GALERA GAMING JOGOS ELETRONICOS S.A.",cnpj:"31.853.299/0001-50",marca:"GALERA.BET",dominio:"galera.bet.br"},

    {req:"0010/2024",portaria:"SPA/MF nº 319, de 17/02/2025 (alt. 1.423, 30/06/2025)",empresa:"F12 DO BRASIL JOGOS ELETRONICOS LTDA",cnpj:"51.897.834/0001-82",marca:"F12.BET",dominio:"f12.bet.br"},
    {req:"0010/2024",portaria:"SPA/MF nº 319, de 17/02/2025 (alt. 1.423, 30/06/2025)",empresa:"F12 DO BRASIL JOGOS ELETRONICOS LTDA",cnpj:"51.897.834/0001-82",marca:"LUVA.BET",dominio:"luva.bet.br"},
    {req:"0010/2024",portaria:"SPA/MF nº 319, de 17/02/2025 (alt. 1.423, 30/06/2025)",empresa:"F12 DO BRASIL JOGOS ELETRONICOS LTDA",cnpj:"51.897.834/0001-82",marca:"BRASIL.BET",dominio:"brasil.bet.br"},

    {req:"0011/2024",portaria:"SPA/MF nº 2.095, de 30/12/2024 (alt. 480, 10/03/2025)",empresa:"BLAC JOGOS LTDA",cnpj:"55.988.317/0001-70",marca:"SPORTYBET",dominio:"sporty.bet.br"},

    {req:"0012/2024",portaria:'SPA/MF nº 320, de 17/02/2025 (alt. 1.792, 11/08/2025)',empresa:"EB INTERMEDIACOES E JOGOS S.A.",cnpj:"52.639.845/0001-25",marca:"ESTRELABET",dominio:"estrelabet.bet.br"},
    {req:"0012/2024",portaria:'SPA/MF nº 320, de 17/02/2025 (alt. 1.792, 11/08/2025)',empresa:"EB INTERMEDIACOES E JOGOS S.A.",cnpj:"52.639.845/0001-25",marca:"VUPI",dominio:"vupi.bet.br"},

    {req:"0013/2024",portaria:"SPA/MF nº 372, de 24/02/2025 (alt. 1.896, 27/08/2025)",empresa:"REALS BRASIL LTDA",cnpj:"56.197.912/0001-50",marca:"REALS",dominio:"reals.bet.br"},
    {req:"0013/2024",portaria:"SPA/MF nº 372, de 24/02/2025 (alt. 1.896, 27/08/2025)",empresa:"REALS BRASIL LTDA",cnpj:"56.197.912/0001-50",marca:"UX",dominio:"ux.bet.br"},
    {req:"0013/2024",portaria:"SPA/MF nº 372, de 24/02/2025 (alt. 1.896, 27/08/2025)",empresa:"REALS BRASIL LTDA",cnpj:"56.197.912/0001-50",marca:"BINGO",dominio:"bingo.bet.br",obs:"A marca NETPIX foi substituída pela marca BINGO (Portaria SPA/MF nº 1.896/2025)."},

    {req:"0014/2024",portaria:"SPA/MF nº 248, de 07/02/2025",empresa:"BETFAIR BRASIL LTDA",cnpj:"55.229.080/0001-43",marca:"BETFAIR",dominio:"betfair.bet.br"},

    {req:"0015/2024",portaria:"SPA/MF nº 2.096, de 30/12/2024",empresa:"OIG GAMING BRAZIL LTDA",cnpj:"55.459.453/0001-72",marca:"7GAMES",dominio:"7games.bet.br"},
    {req:"0015/2024",portaria:"SPA/MF nº 2.096, de 30/12/2024",empresa:"OIG GAMING BRAZIL LTDA",cnpj:"55.459.453/0001-72",marca:"BETÃO",dominio:"betao.bet.br"},
    {req:"0015/2024",portaria:"SPA/MF nº 2.096, de 30/12/2024",empresa:"OIG GAMING BRAZIL LTDA",cnpj:"55.459.453/0001-72",marca:"R7",dominio:"r7.bet.br"},

    {req:"0016/2024",portaria:"SPA/MF nº 321, de 17/02/2025",empresa:"HIPER BET TECNOLOGIA LTDA.",cnpj:"55.404.799/0001-73",marca:"HIPERBET",dominio:"hiper.bet.br"},

    {req:"0017/2024",portaria:"SPA/MF nº 249, de 07/02/2025",empresa:"NVBT GAMING LTDA",cnpj:"50.587.712/0001-27",marca:"NOVIBET",dominio:"novibet.bet.br"},

    {req:"0018/2024",portaria:"SPA/MF nº 2.097, de 30/12/2024",empresa:"SEGURO BET LTDA",cnpj:"56.268.974/0001-05",marca:"SEGURO BET",dominio:"seguro.bet.br"},
    {req:"0018/2024",portaria:"SPA/MF nº 2.097, de 30/12/2024",empresa:"SEGURO BET LTDA",cnpj:"56.268.974/0001-05",marca:"KING PANDA",dominio:"kingpanda.bet.br"},

    {req:"0019/2024",portaria:"SPA/MF nº 464, de 10/03/2025",empresa:"GAMEWIZ BRASIL LTDA",cnpj:"56.195.099/0001-89",marca:"9F",dominio:"9f.bet.br"},
    {req:"0019/2024",portaria:"SPA/MF nº 464, de 10/03/2025",empresa:"GAMEWIZ BRASIL LTDA",cnpj:"56.195.099/0001-89",marca:"6R",dominio:"6r.bet.br"},
    {req:"0019/2024",portaria:"SPA/MF nº 464, de 10/03/2025",empresa:"GAMEWIZ BRASIL LTDA",cnpj:"56.195.099/0001-89",marca:"BET.APP",dominio:"betapp.bet.br"},

    {req:"0020/2024",portaria:"SPA/MF nº 465, de 10/03/2025",empresa:"GAMEWIZ BRASIL LTDA",cnpj:"56.195.099/0001-89",marca:"IJOGO",dominio:"ijogo.bet.br"},
    {req:"0020/2024",portaria:"SPA/MF nº 465, de 10/03/2025",empresa:"GAMEWIZ BRASIL LTDA",cnpj:"56.195.099/0001-89",marca:"FOGO777",dominio:"fogo777.bet.br"},
    {req:"0020/2024",portaria:"SPA/MF nº 465, de 10/03/2025",empresa:"GAMEWIZ BRASIL LTDA",cnpj:"56.195.099/0001-89",marca:"P9",dominio:"p9.bet.br"},

    {req:"0021/2024",portaria:"SPA/MF nº 250, de 07/02/2025",empresa:"HS DO BRASIL LTDA",cnpj:"47.123.407/0001-70",marca:"BET365",dominio:"bet365.bet.br"},

    {req:"0022/2024",portaria:"SPA/MF nº 251, de 07/02/2025",empresa:"APOSTA GANHA LOTERIAS LTDA",cnpj:"56.001.749/0001-08",marca:"APOSTA GANHA",dominio:"apostaganha.bet.br"},

    {req:"0023/2024",portaria:"SPA/MF nº 466, de 10/03/2025",empresa:"FUTURAS APOSTAS LTDA",cnpj:"55.399.607/0001-88",marca:"BRAZINO777",dominio:"brazino777.bet.br"},

    {req:"0025/2024",portaria:"SPA/MF nº 252, de 07/02/2025 (alt. 713, 02/04/2025)",empresa:"Lucky Gaming LTDA",cnpj:"56.212.040/0001-51",marca:"4WIN",dominio:"4win.bet.br"},
    {req:"0025/2024",portaria:"SPA/MF nº 252, de 07/02/2025 (alt. 713, 02/04/2025)",empresa:"Lucky Gaming LTDA",cnpj:"56.212.040/0001-51",marca:"4PLAY",dominio:"4play.bet.br"},
    {req:"0025/2024",portaria:"SPA/MF nº 252, de 07/02/2025 (alt. 713, 02/04/2025)",empresa:"Lucky Gaming LTDA",cnpj:"56.212.040/0001-51",marca:"PAGOL",dominio:"pagol.bet.br"},

    {req:"0027/2024",portaria:"SPA/MF nº 253, de 07/02/2025",empresa:"H2 LICENSED LTDA",cnpj:"56.303.755/0001-10",marca:"SEUBET",dominio:"seu.bet.br"},
    {req:"0027/2024",portaria:"SPA/MF nº 253, de 07/02/2025",empresa:"H2 LICENSED LTDA",cnpj:"56.303.755/0001-10",marca:"H2 BET",dominio:"h2.bet.br"},

    {req:"0028/2024",portaria:"SPA/MF nº 254, de 07/02/2025",empresa:"SC OPERATING BRAZIL LTDA",cnpj:"54.068.631/0001-71",marca:"VBET",dominio:"vbet.bet.br"},
    {req:"0028/2024",portaria:"SPA/MF nº 254, de 07/02/2025",empresa:"SC OPERATING BRAZIL LTDA",cnpj:"54.068.631/0001-71",marca:"VIVARO",dominio:"vivaro.bet.br"},

    {req:"0029/2024",portaria:"SPA/MF nº 255, de 07/02/2025",empresa:"CDA GAMING LTDA",cnpj:"56.636.543/0001-54",marca:"CASA DE APOSTAS",dominio:"casadeapostas.bet.br"},
    {req:"0029/2024",portaria:"SPA/MF nº 255, de 07/02/2025",empresa:"CDA GAMING LTDA",cnpj:"56.636.543/0001-54",marca:"BET SUL",dominio:"betsul.bet.br"},
    {req:"0029/2024",portaria:"SPA/MF nº 255, de 07/02/2025",empresa:"CDA GAMING LTDA",cnpj:"56.636.543/0001-54",marca:"JOGO ONLINE",dominio:"jogoonline.bet.br"},

    {req:"0030/2024",portaria:"SPA/MF nº 136, de 22/01/2025 (alt. 1.559, 16/07/2025; retif. 18/07/2025)",empresa:"ESPORTES GAMING BRASIL LTDA",cnpj:"56.075.466/0001-00",marca:"ESPORTES DA SORTE",dominio:"esportesdasorte.bet.br"},
    {req:"0030/2024",portaria:"SPA/MF nº 136, de 22/01/2025 (alt. 1.559, 16/07/2025; retif. 18/07/2025)",empresa:"ESPORTES GAMING BRASIL LTDA",cnpj:"56.075.466/0001-00",marca:"ONABET",dominio:"ona.bet.br"},
    {req:"0030/2024",portaria:"SPA/MF nº 136, de 22/01/2025 (alt. 1.559, 16/07/2025; retif. 18/07/2025)",empresa:"ESPORTES GAMING BRASIL LTDA",cnpj:"56.075.466/0001-00",marca:"LOTTU",dominio:"lottu.bet.br"},

    {req:"0031/2024",portaria:"SPA/MF nº 467, de 10/03/2025",empresa:"FAST GAMING S.A.",cnpj:"55.980.542/0001-60",marca:"BETFAST",dominio:"betfast.bet.br"},
    {req:"0031/2024",portaria:"SPA/MF nº 467, de 10/03/2025",empresa:"FAST GAMING S.A.",cnpj:"55.980.542/0001-60",marca:"FAZ1BET",dominio:"faz1.bet.br"},
    {req:"0031/2024",portaria:"SPA/MF nº 467, de 10/03/2025",empresa:"FAST GAMING S.A.",cnpj:"55.980.542/0001-60",marca:"TIVOBET",dominio:"tivo.bet.br"},

    {req:"0032/2024",portaria:"SPA/MF nº 256, de 07/02/2025 (alt. 1.539, 14/07/2025)",empresa:"SUPREMA BET LTDA",cnpj:"56.183.358/0001-51",marca:"SUPREMABET",dominio:"suprema.bet.br"},
    {req:"0032/2024",portaria:"SPA/MF nº 256, de 07/02/2025 (alt. 1.539, 14/07/2025)",empresa:"SUPREMA BET LTDA",cnpj:"56.183.358/0001-51",marca:"MAXIMABET",dominio:"maxima.bet.br"},
    {req:"0032/2024",portaria:"SPA/MF nº 256, de 07/02/2025 (alt. 1.539, 14/07/2025)",empresa:"SUPREMA BET LTDA",cnpj:"56.183.358/0001-51",marca:"ULTRABET",dominio:"ultra.bet.br"},

    {req:"0033/2024",portaria:"SPA/MF nº 257, de 07/02/2025",empresa:"BETESPORTE APOSTAS ON LINE LTDA",cnpj:"56.295.104/0001-25",marca:"BETESPORTE",dominio:"betesporte.bet.br"},
    {req:"0033/2024",portaria:"SPA/MF nº 257, de 07/02/2025",empresa:"BETESPORTE APOSTAS ON LINE LTDA",cnpj:"56.295.104/0001-25",marca:"LANCE DE SORTE",dominio:"lancedesorte.bet.br"},

    {req:"0036/2024",portaria:"SPA/MF nº 2.098, de 30/12/2024",empresa:"BOA LION S.A.",cnpj:"53.837.227/0001-52",marca:"BETMGM",dominio:"betmgm.bet.br"},
    {req:"0036/2024",portaria:"SPA/MF nº 2.098, de 30/12/2024",empresa:"BOA LION S.A.",cnpj:"53.837.227/0001-52",marca:"MGM",dominio:"mgm.bet.br"},

    {req:"0037/2024",portaria:"SPA/MF nº 258, de 07/02/2025 (alt. 1.426, 30/06/2025)",empresa:"BETSPEED LTDA",cnpj:"56.061.524/0001-47",marca:"TIGER",dominio:"tiger.bet.br"},
    {req:"0037/2024",portaria:"SPA/MF nº 258, de 07/02/2025 (alt. 1.426, 30/06/2025)",empresa:"BETSPEED LTDA",cnpj:"56.061.524/0001-47",marca:"PQ777",dominio:"pq777.bet.br"},
    {req:"0037/2024",portaria:"SPA/MF nº 258, de 07/02/2025 (alt. 1.426, 30/06/2025)",empresa:"BETSPEED LTDA",cnpj:"56.061.524/0001-47",marca:"5G",dominio:"5g.bet.br"},

    {req:"0039/2024",portaria:"SPA/MF nº 468, de 10/03/2025",empresa:"BLOW MARKETPLACE LTDA",cnpj:"37.486.405/0001-91",marca:"BRAVO",dominio:"bravo.bet.br"},
    {req:"0039/2024",portaria:"SPA/MF nº 468, de 10/03/2025",empresa:"BLOW MARKETPLACE LTDA",cnpj:"37.486.405/0001-91",marca:"TRADICIONAL",dominio:"tradicional.bet.br"},
    {req:"0039/2024",portaria:"SPA/MF nº 468, de 10/03/2025",empresa:"BLOW MARKETPLACE LTDA",cnpj:"37.486.405/0001-91",marca:"APOSTATUDO",dominio:"apostatudo.bet.br"},

    {req:"0040/2024",portaria:"SPA/MF nº 259, de 07/02/2025",empresa:"LEVANTE BRASIL LTDA",cnpj:"55.045.663/0001-14",marca:"SORTE ONLINE",dominio:"sorteonline.bet.br"},
    {req:"0040/2024",portaria:"SPA/MF nº 259, de 07/02/2025",empresa:"LEVANTE BRASIL LTDA",cnpj:"55.045.663/0001-14",marca:"LOTTOLAND",dominio:"lottoland.bet.br"},

    {req:"0041/2024",portaria:"SPA/MF nº 2.099, de 30/12/2024 (alt. 1.791, 11/08/2025)",empresa:"DIGIPLUS BRAZIL INTERACTIVE LTDA",cnpj:"56.060.798/0001-11",marca:"ARENAPLUS",dominio:"arenaplus.bet.br"},
    {req:"0041/2024",portaria:"SPA/MF nº 2.099, de 30/12/2024 (alt. 1.791, 11/08/2025)",empresa:"DIGIPLUS BRAZIL INTERACTIVE LTDA",cnpj:"56.060.798/0001-11",marca:"GAMEPLUS",dominio:"gameplus.bet.br"},
    {req:"0041/2024",portaria:"SPA/MF nº 2.099, de 30/12/2024 (alt. 1.761, 11/08/2025)",empresa:"DIGIPLUS BRAZIL INTERACTIVE LTDA",cnpj:"56.060.798/0001-11",marca:"BINGOPLUS",dominio:"bingoplus.bet.br"},

    {req:"0042/2024",portaria:"SPA/MF nº 806, de 14/04/2025",empresa:"PIXBET SOLUÇÕES TECNOLÓGICAS LTDA.",cnpj:"40.633.348/0001-30",marca:"PIXBET",dominio:"pix.bet.br"},
    {req:"0042/2024",portaria:"SPA/MF nº 806, de 14/04/2025",empresa:"PIXBET SOLUÇÕES TECNOLÓGICAS LTDA.",cnpj:"40.633.348/0001-30",marca:"FLABET",dominio:"fla.bet.br"},
    {req:"0042/2024",portaria:"SPA/MF nº 806, de 14/04/2025",empresa:"PIXBET SOLUÇÕES TECNOLÓGICAS LTDA.",cnpj:"40.633.348/0001-30",marca:"BET DA SORTE",dominio:"betdasorte.bet.br"},

    {req:"0045/2024",portaria:"SPA/MF nº 373, de 24/02/2025",empresa:"BETBR LOTERIAS LTDA",cnpj:"55.881.028/0001-77",marca:"APOSTOU",dominio:"apostou.bet.br"},
    {req:"0045/2024",portaria:"SPA/MF nº 373, de 24/02/2025",empresa:"BETBR LOTERIAS LTDA",cnpj:"55.881.028/0001-77",marca:"B1 BET",dominio:"b1bet.bet.br"},
    {req:"0045/2024",portaria:"SPA/MF nº 373, de 24/02/2025",empresa:"BETBR LOTERIAS LTDA",cnpj:"55.881.028/0001-77",marca:"BRBET",dominio:"brbet.bet.br"},

    {req:"0046/2024",portaria:"SPA/MF nº 469, de 10/03/2025",empresa:"GORILLAS GROUP DO BRASIL LTDA",cnpj:"37.456.039/0001-28",marca:"BET GORILLAS",dominio:"betgorillas.bet.br"},
    {req:"0046/2024",portaria:"SPA/MF nº 469, de 10/03/2025",empresa:"GORILLAS GROUP DO BRASIL LTDA",cnpj:"37.456.039/0001-28",marca:"BET BUFFALOS",dominio:"betbuffalos.bet.br"},
    {req:"0046/2024",portaria:"SPA/MF nº 469, de 10/03/2025",empresa:"GORILLAS GROUP DO BRASIL LTDA",cnpj:"37.456.039/0001-28",marca:"BET FALCONS",dominio:"betfalcons.bet.br"},

    {req:"0047/2024",portaria:"SPA/MF nº 523, de 14/03/2025 (alt. 1.885, 26/08/2025)",empresa:"EA ENTRETENIMENTO E ESPORTES LTDA",cnpj:"53.570.592/0001-43",marca:"BATEU BET",dominio:"bateu.bet.br"},
    {req:"0047/2024",portaria:"SPA/MF nº 523, de 14/03/2025 (alt. 1.885, 26/08/2025)",empresa:"EA ENTRETENIMENTO E ESPORTES LTDA",cnpj:"53.570.592/0001-43",marca:"ESPORTIVA BET",dominio:"esportiva.bet.br"},

    {req:"0049/2024",portaria:"SPA/MF nº 470, de 10/03/2025",empresa:"TRACK GAMING BRASIL LTDA",cnpj:"56.706.701/0001-03",marca:"BETWARRIOR",dominio:"betwarrior.bet.br"},

    {req:"0050/2024",portaria:"SPA/MF nº 260, de 07/02/2025",empresa:"SORTENABET GAMING BRASIL S.A.",cnpj:"54.989.030/0001-00",marca:"SORTENABET",dominio:"sortenabet.bet.br"},
    {req:"0050/2024",portaria:"SPA/MF nº 260, de 07/02/2025",empresa:"SORTENABET GAMING BRASIL S.A.",cnpj:"54.989.030/0001-00",marca:"BETOU",dominio:"betou.bet.br"},
    {req:"0050/2024",portaria:"SPA/MF nº 260, de 07/02/2025",empresa:"SORTENABET GAMING BRASIL S.A.",cnpj:"54.989.030/0001-00",marca:"BETFUSION",dominio:"betfusion.bet.br"},

    {req:"0051/2024",portaria:"SPA/MF nº 270, de 10/02/2025",empresa:"BELL VENTURES DIGITAL LTDA",cnpj:"56.638.458/0001-25",marca:"BANDBET",dominio:"bandbet.bet.br"},

    {req:"0052/2024",portaria:"SPA/MF nº 261, de 07/02/2025",empresa:"BRILLIANT GAMING LTDA",cnpj:"56.259.060/0001-88",marca:"AFUN",dominio:"afun.bet.br"},
    {req:"0052/2024",portaria:"SPA/MF nº 261, de 07/02/2025",empresa:"BRILLIANT GAMING LTDA",cnpj:"56.259.060/0001-88",marca:"AI",dominio:"ai.bet.br"},
    {req:"0052/2024",portaria:"SPA/MF nº 261, de 07/02/2025",empresa:"BRILLIANT GAMING LTDA",cnpj:"56.259.060/0001-88",marca:"6Z",dominio:"6z.bet.br"},

    {req:"0053/2024",portaria:"SPA/MF nº 471, de 10/03/2025",empresa:"FOGGO ENTERTAINMENT LTDA",cnpj:"56.431.248/0001-61",marca:"BLAZE",dominio:"blaze.bet.br"},
    {req:"0053/2024",portaria:"SPA/MF nº 471, de 10/03/2025",empresa:"FOGGO ENTERTAINMENT LTDA",cnpj:"56.431.248/0001-61",marca:"JONBET",dominio:"jonbet.bet.br"},

    {req:"0054/2024",portaria:"SPA/MF nº 322, de 17/02/2025 (alt. 1.056, 14/05/2025)",empresa:"ANA GAMING BRASIL S.A.",cnpj:"55.933.850/0001-34",marca:"7K",dominio:"7k.bet.br"},
    {req:"0054/2024",portaria:"SPA/MF nº 322, de 17/02/2025 (alt. 1.056, 14/05/2025)",empresa:"ANA GAMING BRASIL S.A.",cnpj:"55.933.850/0001-34",marca:"CASSINO",dominio:"cassino.bet.br"},
    {req:"0054/2024",portaria:"SPA/MF nº 322, de 17/02/2025 (alt. 1.056, 14/05/2025)",empresa:"ANA GAMING BRASIL S.A.",cnpj:"55.933.850/0001-34",marca:"VERA",dominio:"vera.bet.br"},

    {req:"0055/2024",portaria:"SPA/MF nº 1.344, de 18/06/2025",empresa:"TQJ-PAR PARTICIPAÇÕES SOCIETÁRIAS S.A.",cnpj:"55.238.676/0001-00",marca:"BAÚ BINGO",dominio:"bau.bet.br"},
    {req:"0055/2024",portaria:"SPA/MF nº 1.344, de 18/06/2025",empresa:"TQJ-PAR PARTICIPAÇÕES SOCIETÁRIAS S.A.",cnpj:"55.238.676/0001-00",marca:"TELE SENA BET",dominio:"telesena.bet.br"},
    {req:"0055/2024",portaria:"SPA/MF nº 1.344, de 18/06/2025",empresa:"TQJ-PAR PARTICIPAÇÕES SOCIETÁRIAS S.A.",cnpj:"55.238.676/0001-00",marca:"BET DO MILHÃO",dominio:"milhao.bet.br"},

    {req:"0056/2024",portaria:"SPA/MF nº 844, de 17/04/2025 (alt. 975/06-05-2025 e 1.176/29-05-2025)",empresa:"7MBR LTDA",cnpj:"56.442.917/0001-09",marca:"VERTBET",dominio:"vert.bet.br"},
    {req:"0056/2024",portaria:"SPA/MF nº 844, de 17/04/2025 (alt. 975/06-05-2025 e 1.176/29-05-2025)",empresa:"7MBR LTDA",cnpj:"56.442.917/0001-09",marca:"CGG",dominio:"cgg.bet.br"},
    {req:"0056/2024",portaria:"SPA/MF nº 844, de 17/04/2025 (alt. 975/06-05-2025 e 1.176/29-05-2025)",empresa:"7MBR LTDA",cnpj:"56.442.917/0001-09",marca:"FANBIT",dominio:"fanbit.bet.br"},

    {req:"0057/2024",portaria:"SPA/MF nº 323, de 17/02/2025",empresa:"UPBET BRASIL LTDA",cnpj:"56.236.761/0001-00",marca:"UPBETBR",dominio:"up.bet.br"},
    {req:"0057/2024",portaria:"SPA/MF nº 323, de 17/02/2025",empresa:"UPBET BRASIL LTDA",cnpj:"56.236.761/0001-00",marca:"9D",dominio:"9d.bet.br"},
    {req:"0057/2024",portaria:"SPA/MF nº 323, de 17/02/2025",empresa:"UPBET BRASIL LTDA",cnpj:"56.236.761/0001-00",marca:"WJCASINO",dominio:"wjcasino.bet.br"},

    {req:"0058/2024",portaria:"Portaria SPA/MF nº 1.792, de 13/08/2025",empresa:"ENSEADA SERVIÇOS E TECNOLOGIA LTDA",cnpj:"53.429.401/0001-28",marca:"KBET",dominio:"kbet.bet.br"},

    {req:"0060/2024",portaria:"SPA/MF nº 2.100, de 30/12/2024",empresa:"ALFA ENTRETENIMENTO S.A.",cnpj:"55.359.927/0001-04",marca:"ALFA.BET",dominio:"alfa.bet.br"},

    {req:"0062/2024",portaria:"SPA/MF nº 1.112, de 21/05/2025",empresa:"SELECT OPERATIONS LTDA",cnpj:"56.875.122/0001-86",marca:"MMA",dominio:"mmabet.bet.br"},
    {req:"0062/2024",portaria:"SPA/MF nº 1.112, de 21/05/2025",empresa:"SELECT OPERATIONS LTDA",cnpj:"56.875.122/0001-86",marca:"BETVIP",dominio:"betvip.bet.br"},
    {req:"0062/2024",portaria:"SPA/MF nº 1.112, de 21/05/2025",empresa:"SELECT OPERATIONS LTDA",cnpj:"56.875.122/0001-86",marca:"PAPIGAMES",dominio:"papigames.bet.br"},

    {req:"0063/2024",portaria:"SPA/MF nº 472, de 10/03/2025",empresa:"B3T4 INTERNATIONAL GROUP LTDA",cnpj:"56.706.644/0001-54",marca:"BET4",dominio:"bet4.bet.br"},
    {req:"0063/2024",portaria:"SPA/MF nº 472, de 10/03/2025",empresa:"B3T4 INTERNATIONAL GROUP LTDA",cnpj:"56.706.644/0001-54",marca:"APOSTA BET",dominio:"aposta.bet.br"},
    {req:"0063/2024",portaria:"SPA/MF nº 472, de 10/03/2025",empresa:"B3T4 INTERNATIONAL GROUP LTDA",cnpj:"56.706.644/0001-54",marca:"FAZ O BET",dominio:"fazo.bet.br"},

    {req:"0065/2024",portaria:"SPA/MF nº 1.055, de 14/05/2025",empresa:"SPORTVIP GROUP INTERNATIONAL APOSTAS LTDA",cnpj:"56.257.966/0001-63",marca:"ESPORTIVAVIP",dominio:"esportivavip.bet.br"},
    {req:"0065/2024",portaria:"SPA/MF nº 1.055, de 14/05/2025",empresa:"SPORTVIP GROUP INTERNATIONAL APOSTAS LTDA",cnpj:"56.257.966/0001-63",marca:"CBESPORTES",dominio:"cbesportes.bet.br"},
    {req:"0065/2024",portaria:"SPA/MF nº 1.055, de 14/05/2025",empresa:"SPORTVIP GROUP INTERNATIONAL APOSTAS LTDA",cnpj:"56.257.966/0001-63",marca:"DONOSDABOLA",dominio:"donosdabola.bet.br"},

    {req:"0066/2024",portaria:"SPA/MF nº 399, de 24/02/2025",empresa:"SABIA ADMINISTRACAO LTDA",cnpj:"04.426.418/0001-16",marca:"BR4BET",dominio:"br4.bet.br"},
    {req:"0066/2024",portaria:"SPA/MF nº 399, de 24/02/2025",empresa:"SABIA ADMINISTRACAO LTDA",cnpj:"04.426.418/0001-16",marca:"GOL DE BET",dominio:"goldebet.bet.br"},
    {req:"0066/2024",portaria:"SPA/MF nº 399, de 24/02/2025",empresa:"SABIA ADMINISTRACAO LTDA",cnpj:"04.426.418/0001-16",marca:"LOTOGREEN",dominio:"lotogreen.bet.br"},

    {req:"0067/2024",portaria:"SPA/MF nº 2.101, de 30/12/2024",empresa:"A2FBR LTDA",cnpj:"56.147.145/0001-74",marca:"BOLSA DE APOSTA",dominio:"bolsadeaposta.bet.br"},
    {req:"0067/2024",portaria:"SPA/MF nº 2.101, de 30/12/2024",empresa:"A2FBR LTDA",cnpj:"56.147.145/0001-74",marca:"BOLSA DE APOSTA",dominio:"fulltbet.bet.br"},
    {req:"0067/2024",portaria:"SPA/MF nº 2.101, de 30/12/2024",empresa:"A2FBR LTDA",cnpj:"56.147.145/0001-74",marca:"BOLSA DE APOSTA",dominio:"betbra.bet.br"},
    {req:"0067/2024",portaria:"SPA/MF nº 2.102, de 30/12/2024",empresa:"A2FBR LTDA",cnpj:"56.147.145/0001-74",marca:"PINNACLE",dominio:"pinnacle.bet.br"},
    {req:"0067/2024",portaria:"SPA/MF nº 2.102, de 30/12/2024",empresa:"A2FBR LTDA",cnpj:"56.147.145/0001-74",marca:"MATCHBOOK",dominio:"matchbook.bet.br"},
    {req:"0067/2024",portaria:"SPA/MF nº 2.102, de 30/12/2024",empresa:"A2FBR LTDA",cnpj:"56.147.145/0001-74",marca:"BETESPECIAL",dominio:"betespecial.bet.br"},

    {req:"0069/2024",portaria:"SPA/MF nº 2.103, de 30/12/2024",empresa:"BETBOOM LTDA",cnpj:"54.951.974/0001-80",marca:"BETBOOM",dominio:"betboom.bet.br"},

    {req:"0072/2024",portaria:"SPA/MF nº 524, de 30/03/2025 (alt. 1.760, 11/08/2025)",empresa:"PIX NA HORA",cnpj:"55.258.645/0001-10",marca:"APOSTA1",dominio:"aposta1.bet.br"},
    {req:"0072/2024",portaria:"SPA/MF nº 524, de 30/03/2025 (alt. 1.760, 11/08/2025)",empresa:"PIX NA HORA",cnpj:"55.258.645/0001-10",marca:"APOSTAMAX",dominio:"apostamax.bet.br"},
    {req:"0072/2024",portaria:"SPA/MF nº 524, de 30/03/2025 (alt. 1.760, 11/08/2025)",empresa:"PIX NA HORA",cnpj:"55.258.645/0001-10",marca:"AVIAOBET",dominio:"aviao.bet.br"},

    {req:"0073/2024",portaria:"SPA/MF nº 262, de 07/02/2025",empresa:"JOGO PRINCIPAL LTDA",cnpj:"56.302.709/0001-04",marca:"GINGABET",dominio:"ginga.bet.br"},
    {req:"0073/2024",portaria:"SPA/MF nº 262, de 07/02/2025",empresa:"JOGO PRINCIPAL LTDA",cnpj:"56.302.709/0001-04",marca:"QGBET",dominio:"qg.bet.br"},
    {req:"0073/2024",portaria:"SPA/MF nº 262, de 07/02/2025",empresa:"JOGO PRINCIPAL LTDA",cnpj:"56.302.709/0001-04",marca:"VIVASORTE",dominio:"vivasorte.bet.br"},

    {req:"0074/2024",portaria:"SPA/MF nº 374, de 24/02/2025",empresa:"SKILL ON NET LTDA",cnpj:"55.927.219/0001-22",marca:"BACANAPLAY",dominio:"bacanaplay.bet.br"},
    {req:"0074/2024",portaria:"SPA/MF nº 374, de 24/02/2025",empresa:"SKILL ON NET LTDA",cnpj:"55.927.219/0001-22",marca:"PLAYUZU",dominio:"playuzu.bet.br"},

    {req:"0075/2024",portaria:"SPA/MF nº 473, de 10/03/2025",empresa:"WORLD SPORTS TECHNOLOGY DO BRASIL S.A.",cnpj:"55.822.818/0001-81",marca:"BETCOPA",dominio:"betcopa.bet.br"},
    {req:"0075/2024",portaria:"SPA/MF nº 473, de 10/03/2025",empresa:"WORLD SPORTS TECHNOLOGY DO BRASIL S.A.",cnpj:"55.822.818/0001-81",marca:"BRASIL DA SORTE",dominio:"brasildasorte.bet.br"},
    {req:"0075/2024",portaria:"SPA/MF nº 473, de 10/03/2025",empresa:"WORLD SPORTS TECHNOLOGY DO BRASIL S.A.",cnpj:"55.822.818/0001-81",marca:"FYBET",dominio:"fybet.bet.br"},

    {req:"0077/2024",portaria:"SPA/MF nº 525, de 14/03/2025",empresa:"RR PARTICIPACOES E INTERMEDIACOES DE NEGOCIOS LTDA",cnpj:"23.159.703/0001-62",marca:"MULTIBET",dominio:"multi.bet.br"},
    {req:"0077/2024",portaria:"SPA/MF nº 525, de 14/03/2025",empresa:"RR PARTICIPACOES E INTERMEDIACOES DE NEGOCIOS LTDA",cnpj:"23.159.703/0001-62",marca:"RICOBET",dominio:"rico.bet.br"},
    {req:"0077/2024",portaria:"SPA/MF nº 525, de 14/03/2025",empresa:"RR PARTICIPACOES E INTERMEDIACOES DE NEGOCIOS LTDA",cnpj:"23.159.703/0001-62",marca:"BRXBET",dominio:"brx.bet.br"},

    {req:"0079/2024",portaria:"SPA/MF nº 263, de 07/02/2025",empresa:"STAKE BRAZIL LTDA",cnpj:"56.525.936/0001-90",marca:"STAKE",dominio:"stake.bet.br"},

    {req:"0081/2024",portaria:"SPA/MF nº 1.665, de 29/07/2025",empresa:"CAIXA LOTERIAS S.A.",cnpj:"24.038.490/0001-83",marca:"BETCAIXA",dominio:"betcaixa.bet.br"},
    {req:"0081/2024",portaria:"SPA/MF nº 1.665, de 29/07/2025",empresa:"CAIXA LOTERIAS S.A.",cnpj:"24.038.490/0001-83",marca:"MEGABET",dominio:"megabet.bet.br"},
    {req:"0081/2024",portaria:"SPA/MF nº 1.665, de 29/07/2025",empresa:"CAIXA LOTERIAS S.A.",cnpj:"24.038.490/0001-83",marca:"XBET CAIXA",dominio:"xbetcaixa.bet.br"},

    {req:"0083/2024",portaria:"SPA/MF nº 1.343, de 18/06/2025",empresa:"RESPONSA GAMMING BRASIL LIMITADA",cnpj:"56.905.647/0001-17",marca:"JOGA LIMPO",dominio:"jogalimpo.bet.br"},
    {req:"0083/2024",portaria:"SPA/MF nº 1.343, de 18/06/2025",empresa:"RESPONSA GAMMING BRASIL LIMITADA",cnpj:"56.905.647/0001-17",marca:"ENERGIA",dominio:"energia.bet.br"},

    {req:"0085/2024",portaria:"SPA/MF nº 2.105, de 30/12/2024 (alt. 756, 08/04/2025)",empresa:"LINDAU GAMING BRASIL S.A.",cnpj:"50.550.511/0001-55",marca:"SPIN",dominio:"spin.bet.br"},
    {req:"0085/2024",portaria:"SPA/MF nº 2.105, de 30/12/2024 (alt. 756, 08/04/2025)",empresa:"LINDAU GAMING BRASIL S.A.",cnpj:"50.550.511/0001-55",marca:"OLEYBET",dominio:"oleybet.bet.br"},
    {req:"0085/2024",portaria:"SPA/MF nº 2.105, de 30/12/2024 (alt. 756, 08/04/2025)",empresa:"LINDAU GAMING BRASIL S.A.",cnpj:"50.550.511/0001-55",marca:"BETPARK",dominio:"betpark.bet.br"},

    {req:"0086/2024",portaria:"SPA/MF nº 526, de 14/03/2025 (alt. 1.203, 02/06/2025)",empresa:"MERIDIAN GAMING BRASIL SPE LTDA",cnpj:"56.195.600/0001-07",marca:"MERIDIAN",dominio:"meridianbet.bet.br"},
    {req:"0086/2024",portaria:"SPA/MF nº 526, de 14/03/2025 (alt. 1.203, 02/06/2025)",empresa:"MERIDIAN GAMING BRASIL SPE LTDA",cnpj:"56.195.600/0001-07",marca:"PIN",dominio:"pin.bet.br"},

    {req:"0087/2024",portaria:"Portaria SPA/MF nº 1.791, de 13/08/2025",empresa:"LAGUNA SERVIÇOS E TECNOLOGIA LTDA",cnpj:"50.920.462/0001-03",marca:"NOSSABET",dominio:"nossa.bet.br"},

    {req:"0089/2024",portaria:"SPA/MF nº 474, de 10/03/2025",empresa:"Versus Brasil Ltda",cnpj:"55.080.231/0001-44",marca:"VERSUSBET",dominio:"versus.bet.br"},
    {req:"0089/2024",portaria:"SPA/MF nº 474, de 10/03/2025",empresa:"Versus Brasil Ltda",cnpj:"55.080.231/0001-44",marca:"VS - VERSUS",dominio:"a definir"},

    {req:"0090/2024",portaria:"SPA/MF nº 527, de 14/03/2025",empresa:"LBBR APOSTAS DE QUOTA FIXA LIMITADA",cnpj:"56.441.713/0001-45",marca:"LUCK.BET",dominio:"luck.bet.br"},
    {req:"0090/2024",portaria:"SPA/MF nº 527, de 14/03/2025",empresa:"LBBR APOSTAS DE QUOTA FIXA LIMITADA",cnpj:"56.441.713/0001-45",marca:"1 PRA 1",dominio:"1pra1.bet.br"},
    {req:"0090/2024",portaria:"SPA/MF nº 527, de 14/03/2025",empresa:"LBBR APOSTAS DE QUOTA FIXA LIMITADA",cnpj:"56.441.713/0001-45",marca:"STARTBET",dominio:"start.bet.br"},

    {req:"0092/2024",portaria:"SPA/MF nº 693, de 01/04/2025",empresa:"VANGUARD ENTRETENIMENTO BRASIL LTDA",cnpj:"56.885.537/0001-30",marca:"ESPORTE 365",dominio:"esporte365.bet.br"},
    {req:"0092/2024",portaria:"SPA/MF nº 693, de 01/04/2025",empresa:"VANGUARD ENTRETENIMENTO BRASIL LTDA",cnpj:"56.885.537/0001-30",marca:"BET AKI",dominio:"betaki.bet.br"},
    {req:"0092/2024",portaria:"SPA/MF nº 693, de 01/04/2025",empresa:"VANGUARD ENTRETENIMENTO BRASIL LTDA",cnpj:"56.885.537/0001-30",marca:"JOGO DE OURO",dominio:"jogodeouro.bet.br"},

    {req:"0096/2024",portaria:"SPA/MF nº 324, de 17/02/2025",empresa:"LOGAME DO BRASIL LTDA",cnpj:"56.349.116/0001-95",marca:"LÍDERBET",dominio:"lider.bet.br"},
    {req:"0096/2024",portaria:"SPA/MF nº 324, de 17/02/2025",empresa:"LOGAME DO BRASIL LTDA",cnpj:"56.349.116/0001-95",marca:"GERALBET",dominio:"geralbet.bet.br"},
    {req:"0096/2024",portaria:"SPA/MF nº 324, de 17/02/2025",empresa:"LOGAME DO BRASIL LTDA",cnpj:"56.349.116/0001-95",marca:"B2XBET",dominio:"b2x.bet.br"},

    {req:"0097/2024",portaria:"SPA/MF nº 325, de 17/02/2025 (alt. 1.143, 23/05/2025)",empresa:"SEVENX GAMING LTDA",cnpj:"56.504.413/0001-68",marca:"BULLSBET",dominio:"bullsbet.bet.br"},
    {req:"0097/2024",portaria:"SPA/MF nº 325, de 17/02/2025 (alt. 1.143, 23/05/2025)",empresa:"SEVENX GAMING LTDA",cnpj:"56.504.413/0001-68",marca:"JOGÃO",dominio:"jogao.bet.br"},
    {req:"0097/2024",portaria:"SPA/MF nº 325, de 17/02/2025 (alt. 1.143, 23/05/2025)",empresa:"SEVENX GAMING LTDA",cnpj:"56.504.413/0001-68",marca:"JOGOS",dominio:"jogos.bet.br"},

    {req:"0103/2024",portaria:"SPA/MF nº 326, de 17/02/2025",empresa:"BET.BET SOLUÇÕES TECNOLÓGICAS S.A.",cnpj:"53.274.124/0001-21",marca:"BET.BET",dominio:"betpontobet.bet.br"},
    {req:"0103/2024",portaria:"SPA/MF nº 326, de 17/02/2025",empresa:"BET.BET SOLUÇÕES TECNOLÓGICAS S.A.",cnpj:"53.274.124/0001-21",marca:"DONALDBET",dominio:"donald.bet.br"},

    {req:"0104/2024",portaria:"SPA/MF nº 1.666, de 29/07/2025",empresa:"DEFY LTDA",cnpj:"47.974.569/0001-11",marca:"1XBET",dominio:"1xbet.bet.br"},

    {req:"0105/2024",portaria:"SPA/MF nº 264, de 07/02/2025",empresa:"OLAVIR LTDA",cnpj:"56.873.267/0001-48",marca:"RIVALO",dominio:"rivalo.bet.br"},

    {req:"0106/2024",portaria:"SPA/MF nº 475, de 10/03/2025",empresa:"HILGARDO GAMING LTDA",cnpj:"54.362.120/0001-68",marca:"A247",dominio:"a247.bet.br"},
    {req:"0106/2024",portaria:"SPA/MF nº 475, de 10/03/2025",empresa:"HILGARDO GAMING LTDA",cnpj:"54.362.120/0001-68",marca:"HILGARDO",dominio:"a definir"},
    {req:"0106/2024",portaria:"SPA/MF nº 475, de 10/03/2025",empresa:"HILGARDO GAMING LTDA",cnpj:"54.362.120/0001-68",marca:"HILGARDO GAMING",dominio:"a definir"},

    {req:"0109/2024",portaria:"SPA/MF nº 528, de 14/03/2025 (alt. 2.007, 09/09/2025)",empresa:"SISTEMA LOTÉRICO DE PERNAMBUCO LTDA.",cnpj:"06.023.798/0001-73",marca:"MCGAMES",dominio:"mcgames.bet.br"},
    {req:"0109/2024",portaria:"SPA/MF nº 528, de 14/03/2025 (alt. 2.007, 09/09/2025)",empresa:"SISTEMA LOTÉRICO DE PERNAMBUCO LTDA.",cnpj:"06.023.798/0001-73",marca:"PLAY",dominio:"play.bet.br",obs:'A marca "Montecarlosbet" (domínio mcgamesbet.bet.br) foi substituída por "Play" após a Portaria SPA/MF nº 2.007/2025.'},
    {req:"0109/2024",portaria:"SPA/MF nº 528, de 14/03/2025 (alt. 2.007, 09/09/2025)",empresa:"SISTEMA LOTÉRICO DE PERNAMBUCO LTDA.",cnpj:"06.023.798/0001-73",marca:"MONTECARLOS",dominio:"montecarlos.bet.br"},

    {req:"0118/2024",portaria:"SPA/MF nº 265, de 07/02/2025",empresa:"NEXUS INTERNATIONAL LTDA",cnpj:"55.078.134/0001-17",marca:"MEGAPOSTA",dominio:"megaposta.bet.br"},
    ];

    this.dados = this.consolidarDados(dadosManuais);
    this.dadosFiltrados = [...this.dados];
  }

  consolidarDados(dadosManuais) {
    const map = new Map();
    
    for (const r of dadosManuais) {
      const key = `${r.req}__${r.cnpj}__${r.portaria}`;
      if (!map.has(key)) {
        map.set(key, {
          req: r.req,
          portaria: r.portaria,
          empresa: r.empresa,
          cnpj: r.cnpj,
          marcas: [],
          dominios: []
        });
      }
      
      const item = map.get(key);
      if (r.marca && !item.marcas.find(m => m.nome === r.marca)) {
        item.marcas.push({nome: r.marca, obs: r.obs || ""});
      }
      if (r.dominio && !item.dominios.includes(r.dominio)) {
        item.dominios.push(r.dominio);
      }
    }
    
    return [...map.values()].sort((a, b) => {
      const nr = a.req.localeCompare(b.req, 'pt-BR');
      if (nr !== 0) return nr;
      return (a.empresa || "").localeCompare((b.empresa || ""), 'pt-BR');
    });
  }

  render() {
    const container = document.querySelector('#casas-content');
    if (!container) return;

    container.innerHTML = `
      <div class="calc-header">
        <h1 style="font-size: 1.75rem; font-weight: 800; background: linear-gradient(135deg, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 0.5rem; text-align: center;">Casas Regulamentadas</h1>
        <p style="color: var(--text-secondary); font-size: 0.875rem; text-align: center; max-width: 800px; margin: 0 auto;">
          Empresas autorizadas a explorar a modalidade lotérica de aposta de quota fixa a partir de 1º de janeiro de 2025 em âmbito nacional, conforme as Leis nº 13.756/2018 e nº 14.790/2023 e regulamentação do Ministério da Fazenda.
        </p>
      </div>

      <div class="card">
        <div class="toolbar-casas">
          <input id="searchInput" type="search" class="form-input" placeholder="Buscar por empresa, CNPJ, marca, domínio ou portaria..."/>
          <select id="marcaFilter" class="form-select" title="Filtrar por marca">
            <option value="">Todas as marcas</option>
          </select>
          <button id="exportBtn" class="btn btn-secondary">📊 Exportar CSV</button>
        </div>

        <div class="stats-grid" style="margin: 1rem 0;">
          <div class="stat-card">
            <div class="stat-value" id="totalEmpresas">0</div>
            <div class="stat-label">Empresas</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="totalMarcas">0</div>
            <div class="stat-label">Marcas</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="registrosVisiveis">0</div>
            <div class="stat-label">Registros Visíveis</div>
          </div>
        </div>

        <div class="table-container">
          <table class="casas-table">
            <thead>
              <tr>
                <th>Nº/Ano do Requerimento</th>
                <th>Portaria</th>
                <th>Empresa (CNPJ)</th>
                <th>Marcas</th>
                <th>Domínios</th>
              </tr>
            </thead>
            <tbody id="casasTableBody"></tbody>
          </table>
        </div>

        <div class="casas-footer">
          Base compilada do PDF oficial publicado pela Secretaria de Prêmios e Apostas/MF.
          <span class="badge-info">Última atualização: <span id="lastUpdate"></span></span>
        </div>
      </div>
    `;

    // Atualiza data
    document.getElementById('lastUpdate').textContent = new Date().toLocaleString('pt-BR');
    
    // Adiciona estilos específicos
    this.addCasasStyles();
  }

  bindEvents() {
    const searchInput = document.getElementById('searchInput');
    const marcaFilter = document.getElementById('marcaFilter');
    const exportBtn = document.getElementById('exportBtn');

    if (searchInput) {
      searchInput.addEventListener('input', () => this.filtrarDados());
    }

    if (marcaFilter) {
      marcaFilter.addEventListener('change', () => this.filtrarDados());
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportarCSV());
    }
  }

  popularFiltroMarcas() {
    this.marcasSet = new Set();
    for (const linha of this.dados) {
      for (const marca of (linha.marcas || [])) {
        if (marca?.nome) {
          this.marcasSet.add(marca.nome.trim());
        }
      }
    }

    const select = document.getElementById('marcaFilter');
    if (!select) return;

    const valorAtual = select.value;
    select.innerHTML = '<option value="">Todas as marcas</option>';
    
    [...this.marcasSet].sort((a, b) => a.localeCompare(b, 'pt-BR')).forEach(marca => {
      const option = document.createElement('option');
      option.value = marca;
      option.textContent = marca;
      select.appendChild(option);
    });

    if ([...select.options].some(o => o.value === valorAtual)) {
      select.value = valorAtual;
    }
  }

  filtrarDados() {
    const searchInput = document.getElementById('searchInput');
    const marcaFilter = document.getElementById('marcaFilter');
    
    if (!searchInput || !marcaFilter) return;

    const busca = searchInput.value.trim().toLowerCase();
    const marcaFiltro = marcaFilter.value.trim();

    this.dadosFiltrados = this.dados.filter(linha => {
      const textoCompleto = [
        linha.req,
        linha.portaria,
        linha.empresa,
        linha.cnpj,
        ...(linha.marcas || []).map(x => x.nome),
        ...(linha.dominios || [])
      ].join(' ').toLowerCase();

      const matchBusca = !busca || textoCompleto.includes(busca);
      const matchMarca = !marcaFiltro || (linha.marcas || []).some(m => (m?.nome || '') === marcaFiltro);

      return matchBusca && matchMarca;
    });

    this.renderTabela();
    this.atualizarEstatisticas();
  }

  renderTabela() {
    const tbody = document.getElementById('casasTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (this.dadosFiltrados.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          Nenhum resultado encontrado com os filtros atuais
        </td>
      `;
      tbody.appendChild(tr);
      return;
    }

    this.dadosFiltrados.forEach(linha => {
      const tr = document.createElement('tr');

      // Coluna Requerimento
      const tdReq = document.createElement('td');
      tdReq.className = 'text-muted';
      tdReq.textContent = linha.req || '';
      tr.appendChild(tdReq);

      // Coluna Portaria
      const tdPortaria = document.createElement('td');
      tdPortaria.textContent = linha.portaria || '';
      tr.appendChild(tdPortaria);

      // Coluna Empresa
      const tdEmpresa = document.createElement('td');
      tdEmpresa.innerHTML = `
        <div style="margin-bottom: 0.5rem;">
          <strong>${linha.empresa || ''}</strong>
        </div>
        <div class="cnpj-chip">${linha.cnpj || ''}</div>
      `;
      tr.appendChild(tdEmpresa);

      // Coluna Marcas
      const tdMarcas = document.createElement('td');
      if (linha.marcas?.length) {
        const marcasHtml = linha.marcas.map(m => {
          let html = `<span class="marca-chip">${m.nome}</span>`;
          if (m.obs) {
            html += `<div class="marca-obs">${m.obs}</div>`;
          }
          return html;
        }).join('');
        tdMarcas.innerHTML = marcasHtml;
      } else {
        tdMarcas.innerHTML = '<span class="text-muted">—</span>';
      }
      tr.appendChild(tdMarcas);

      // Coluna Domínios
      const tdDominios = document.createElement('td');
      if (linha.dominios?.length) {
        const dominiosHtml = linha.dominios.map(d => {
          if (d && d !== 'a definir') {
            const url = d.startsWith('http') ? d : `https://${d}`;
            return `<a href="${url}" target="_blank" rel="noopener" class="dominio-link">${d}</a>`;
          } else {
            return `<span class="dominio-pendente">${d}</span>`;
          }
        }).join('');
        tdDominios.innerHTML = dominiosHtml;
      } else {
        tdDominios.innerHTML = '<span class="text-muted">—</span>';
      }
      tr.appendChild(tdDominios);

      tbody.appendChild(tr);
    });
  }

  atualizarEstatisticas() {
    const totalEmpresas = document.getElementById('totalEmpresas');
    const totalMarcas = document.getElementById('totalMarcas');
    const registrosVisiveis = document.getElementById('registrosVisiveis');

    if (totalEmpresas) {
      const empresasUnicas = new Set(this.dados.map(d => d.cnpj)).size;
      totalEmpresas.textContent = empresasUnicas.toString();
    }

    if (totalMarcas) {
      totalMarcas.textContent = this.marcasSet.size.toString();
    }

    if (registrosVisiveis) {
      registrosVisiveis.textContent = this.dadosFiltrados.length.toString();
    }
  }

  exportarCSV() {
    const headers = ['Requerimento', 'Portaria', 'Empresa', 'CNPJ', 'Marcas', 'Domínios'];
    const rows = [headers.join(';')];

    this.dadosFiltrados.forEach(linha => {
      const row = [
        linha.req || '',
        (linha.portaria || '').replace(/;/g, ','),
        (linha.empresa || '').replace(/;/g, ','),
        linha.cnpj || '',
        (linha.marcas || []).map(x => x.nome).join(', ').replace(/;/g, ','),
        (linha.dominios || []).join(', ').replace(/;/g, ',')
      ];
      rows.push(row.join(';'));
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'casas-regulamentadas-spa.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  addCasasStyles() {
    if (document.getElementById('casas-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'casas-styles';
    style.innerHTML = `
      .toolbar-casas {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
        align-items: center;
      }
      
      .toolbar-casas input {
        flex: 1;
        min-width: 200px;
      }
      
      .toolbar-casas select {
        min-width: 150px;
      }
      
      .casas-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
      }
      
      .casas-table th {
        background: rgba(17, 24, 39, 0.8);
        padding: 0.75rem;
        text-align: left;
        font-weight: 600;
        border-bottom: 1px solid var(--border);
      }
      
      [data-theme="light"] .casas-table th {
        background: rgba(248, 250, 252, 0.8);
      }
      
      .casas-table td {
        padding: 0.75rem;
        border-bottom: 1px solid var(--border);
        vertical-align: top;
      }
      
      .casas-table tr:hover {
        background: rgba(59, 130, 246, 0.08);
      }
      
      .cnpj-chip {
        background: rgba(55, 65, 81, 0.6);
        color: var(--text-secondary);
        padding: 0.2rem 0.4rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-family: ui-monospace, monospace;
        display: inline-block;
      }
      
      [data-theme="light"] .cnpj-chip {
        background: rgba(248, 250, 252, 0.8);
        border: 1px solid var(--border);
      }
      
      .marca-chip {
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        color: white;
        padding: 0.3rem 0.6rem;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 600;
        display: inline-block;
        margin: 0.2rem 0.2rem 0.2rem 0;
      }
      
      .marca-obs {
        font-size: 0.75rem;
        color: var(--text-muted);
        margin-top: 0.3rem;
        font-style: italic;
      }
      
      .dominio-link {
        display: inline-block;
        background: rgba(34, 197, 94, 0.1);
        border: 1px solid rgba(34, 197, 94, 0.3);
        color: var(--success);
        padding: 0.3rem 0.6rem;
        border-radius: 6px;
        text-decoration: none;
        font-size: 0.8rem;
        font-weight: 600;
        margin: 0.2rem 0.2rem 0.2rem 0;
        transition: all 0.2s;
      }
      
      .dominio-link:hover {
        background: rgba(34, 197, 94, 0.2);
        transform: translateY(-1px);
      }
      
      .dominio-pendente {
        background: rgba(245, 158, 11, 0.1);
        border: 1px solid rgba(245, 158, 11, 0.3);
        color: var(--warning);
        padding: 0.3rem 0.6rem;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 600;
        display: inline-block;
        margin: 0.2rem 0.2rem 0.2rem 0;
      }
      
      .casas-footer {
        margin-top: 1.5rem;
        padding-top: 1rem;
        border-top: 1px solid var(--border);
        font-size: 0.85rem;
        color: var(--text-secondary);
        text-align: center;
      }
      
      .badge-info {
        background: rgba(6, 182, 212, 0.1);
        border: 1px solid rgba(6, 182, 212, 0.3);
        color: var(--info);
        padding: 0.3rem 0.6rem;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
        margin-left: 0.5rem;
      }
      
      .text-muted {
        color: var(--text-muted);
      }
      
      .stat-value {
        font-size: 1.4rem;
        font-weight: 800;
        color: var(--text-primary);
      }
      
      .stat-label {
        font-size: 0.85rem;
        color: var(--text-secondary);
      }
    `;
    
    document.head.appendChild(style);
  }
}

// Export to window
window.CasasRegulamentadas = CasasRegulamentadas;