// Page Dons : choix du type de don → compte, communication et code QR de virement.
// Le code QR suit la norme EPC (« QR de virement SEPA ») que lisent les apps bancaires belges.
(function () {
  'use strict';
  const box = document.getElementById('donChoices');
  if (!box) return;

  const TXT = {
    fr: {
      title: 'Faire un don',
      lead: "Le plus simple, c'est le virement. Choisissez à quoi sert votre don, puis copiez le numéro de compte ou scannez le code avec l'app de votre banque.",
      q: 'Votre don est pour :',
      'c.dime': 'Dîme et offrandes', 'c.special': 'Don spécial', 'c.solidarite': 'Solidarité', 'c.temple': 'Projet temple',
      'd.dime': "La vie de l'église au quotidien : le culte, le travail pastoral, les locaux.",
      'd.special': 'Un besoin précis : une mission, un événement, un projet annoncé au culte.',
      'd.solidarite': "Le fonds d'entraide pour les membres et les familles qui traversent un moment difficile.",
      'd.temple': "L'achat de notre propre lieu de culte.",
      'm.dime': 'Dîme {mois}', 'm.special': 'Don spécial', 'm.solidarite': 'Solidarité', 'm.temple': 'Projet temple {mois}',
      'l.benef': 'Bénéficiaire', 'l.iban': 'Numéro de compte (IBAN)', 'l.comm': 'Communication',
      copy: 'Copier', copied: 'Copié', 'qr.show': 'Afficher le code QR', 'qr.hide': 'Masquer le code QR',
      'qr.help': "Scannez-le avec l'app de votre banque : le compte et la communication se remplissent tout seuls. Il ne reste qu'à mettre le montant.",
      'cult.t': 'Au culte', 'cult.p': 'Vous pouvez aussi donner le dimanche pendant le culte, au moment de la collecte.',
      'fees.t': 'Frais',
      'fees.p': "L'église ne retient rien sur vos dons. Seule votre banque peut compter ses propres frais, par exemple pour un virement depuis l'étranger. Un don fait par erreur ?",
      'fees.a': 'Voir la politique de dons et de remboursement',
      verse: "« Que chacun donne comme il l'a résolu en son cœur, sans tristesse ni contrainte, car Dieu aime celui qui donne avec joie. »",
      'verse.ref': '2 Corinthiens 9 : 7',
    },
    nl: {
      title: 'Een gift doen',
      lead: 'Een overschrijving is het eenvoudigst. Kies waarvoor uw gift is, kopieer dan het rekeningnummer of scan de code met de app van uw bank.',
      q: 'Uw gift is voor:',
      'c.dime': 'Tiende en offers', 'c.special': 'Speciale gift', 'c.solidarite': 'Solidariteit', 'c.temple': 'Tempelproject',
      'd.dime': 'Het dagelijkse leven van de kerk: de dienst, het pastorale werk, de lokalen.',
      'd.special': 'Een concrete nood: een zending, een evenement, een project dat in de dienst werd aangekondigd.',
      'd.solidarite': 'Het hulpfonds voor leden en gezinnen die het moeilijk hebben.',
      'd.temple': 'De aankoop van ons eigen kerkgebouw.',
      'm.dime': 'Tiende {mois}', 'm.special': 'Speciale gift', 'm.solidarite': 'Solidariteit', 'm.temple': 'Tempelproject {mois}',
      'l.benef': 'Begunstigde', 'l.iban': 'Rekeningnummer (IBAN)', 'l.comm': 'Mededeling',
      copy: 'Kopiëren', copied: 'Gekopieerd', 'qr.show': 'QR-code tonen', 'qr.hide': 'QR-code verbergen',
      'qr.help': 'Scan hem met de app van uw bank: rekening en mededeling worden automatisch ingevuld. U hoeft enkel het bedrag in te vullen.',
      'cult.t': 'Tijdens de dienst', 'cult.p': 'U kunt ook op zondag geven tijdens de dienst, bij de collecte.',
      'fees.t': 'Kosten',
      'fees.p': 'De kerk houdt niets af van uw gift. Enkel uw bank kan eigen kosten aanrekenen, bijvoorbeeld voor een overschrijving vanuit het buitenland. Een gift per vergissing?',
      'fees.a': 'Bekijk ons beleid voor giften en terugbetalingen',
      verse: '« Laat ieder geven zoals hij in zijn hart besloten heeft, niet met tegenzin of gedwongen, want God heeft een blijmoedige gever lief. »',
      'verse.ref': '2 Korintiërs 9 : 7',
    },
    en: {
      title: 'Give',
      lead: "A bank transfer is the simplest way. Choose what your gift is for, then copy the account number or scan the code with your banking app.",
      q: 'Your gift is for:',
      'c.dime': 'Tithes and offerings', 'c.special': 'Special gift', 'c.solidarite': 'Solidarity', 'c.temple': 'Temple project',
      'd.dime': 'The everyday life of the church: services, pastoral work, the building.',
      'd.special': 'A specific need: a mission, an event, a project announced during the service.',
      'd.solidarite': 'The relief fund for members and families going through a hard time.',
      'd.temple': 'Buying our own place of worship.',
      'm.dime': 'Tithe {mois}', 'm.special': 'Special gift', 'm.solidarite': 'Solidarity', 'm.temple': 'Temple project {mois}',
      'l.benef': 'Beneficiary', 'l.iban': 'Account number (IBAN)', 'l.comm': 'Reference',
      copy: 'Copy', copied: 'Copied', 'qr.show': 'Show QR code', 'qr.hide': 'Hide QR code',
      'qr.help': 'Scan it with your banking app: the account and reference are filled in for you. Just add the amount.',
      'cult.t': 'At church', 'cult.p': 'You can also give on Sunday during the service, when the offering is collected.',
      'fees.t': 'Fees',
      'fees.p': 'The church keeps nothing from your gift. Only your bank may charge its own fees, for example for a transfer from abroad. Gave by mistake?',
      'fees.a': 'Read our giving and refund policy',
      verse: '« Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver. »',
      'verse.ref': '2 Corinthians 9:7',
    },
  };
  const MONTHS = {
    fr: 'janvier février mars avril mai juin juillet août septembre octobre novembre décembre',
    nl: 'januari februari maart april mei juni juli augustus september oktober november december',
    en: 'January February March April May June July August September October November December',
  };

  // Comptes par défaut ; remplacés par ceux de l'admin (Dons & Temple)
  const acc = {
    principal: 'BE97 3631 6425 1049',
    solidarite: 'BE42 3632 0186 8154',
    temple: 'BE97 3631 6425 1049',
    benef: 'Centre Évangélique La Famille Chrétienne',
  };
  const ACCOUNT = { dime: 'principal', special: 'principal', solidarite: 'solidarite', temple: 'temple' };

  const lang = () => (TXT[document.documentElement.lang] ? document.documentElement.lang : 'fr');
  const t = k => TXT[lang()][k] ?? TXT.fr[k];
  const $ = id => document.getElementById(id);
  const current = () => (box.querySelector('input:checked') || box.querySelector('input')).value;

  function month() {
    const d = new Date();
    return MONTHS[lang()].split(' ')[d.getMonth()] + ' ' + d.getFullYear();
  }

  function epc(name, iban, text) {
    return ['BCD', '002', '1', 'SCT', '', name.slice(0, 70), iban.replace(/\s/g, '').toUpperCase(), '', '', '', text.slice(0, 140)].join('\n');
  }
  function drawQr(payload) {
    const el = $('donQrImg');
    if (!window.qrcode) { el.parentElement.parentElement.hidden = true; return; }
    const qr = qrcode(0, 'M');
    qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
    qr.addData(payload, 'Byte');
    qr.make();
    el.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  }

  function render() {
    const kind = current();
    document.querySelectorAll('[data-dons]').forEach(el => {
      const v = t(el.dataset.dons);
      if (v && el.textContent !== v) el.textContent = v;
    });
    const qrOpen = $('donQr').classList.contains('open');
    document.querySelector('.don-qr-toggle').textContent = t(qrOpen ? 'qr.hide' : 'qr.show');
    $('donDesc').textContent = t('d.' + kind);
    const iban = acc[ACCOUNT[kind]];
    const comm = t('m.' + kind).replace('{mois}', month());
    $('donIban').textContent = iban;
    $('donComm').textContent = comm;
    $('donBenef').textContent = acc.benef;
    drawQr(epc(acc.benef, iban, comm));
  }

  box.addEventListener('change', render);
  window.addEventListener('cefcLangChange', render);

  document.addEventListener('click', e => {
    const btn = e.target.closest('.don-copy');
    if (btn) {
      const text = $(btn.dataset.copy).textContent.trim();
      const value = btn.dataset.copy === 'donIban' ? text.replace(/\s/g, '') : text;
      const done = () => {
        btn.textContent = t('copied'); btn.classList.add('ok');
        setTimeout(() => { btn.textContent = t('copy'); btn.classList.remove('ok'); }, 1800);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(value).then(done, () => {});
      return;
    }
    if (e.target.closest('.don-qr-toggle')) {
      $('donQr').classList.toggle('open');
      render();
    }
  });

  // Lien direct vers un type de don : dons.html#solidarite, #temple…
  const fromHash = location.hash.slice(1);
  const pre = fromHash && box.querySelector(`input[value="${CSS.escape(fromHash)}"]`);
  if (pre) pre.checked = true;

  render();
  fetch('/contenu.json')
    .then(r => r.json())
    .then(d => {
      const clean = v => (typeof v === 'string' && v.trim()) ? v.trim() : '';
      acc.principal = clean(d.dons && d.dons.iban_principal) || acc.principal;
      acc.solidarite = clean(d.dons && d.dons.iban_solidarite) || acc.solidarite;
      acc.temple = clean(d.temple && d.temple.iban) || acc.principal;
      acc.benef = clean(d.dons && d.dons.beneficiaire) || acc.benef;
      render();
    })
    .catch(() => {});
})();
