import fs from 'node:fs';

const USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const candidates = {
  CRCLx: 'XsueG8BtpquVJX9LVLLEGuViXUungE6WmK5YZ3p3bd1',
  HOODx: 'XsvNBAYkrDRNhA7wPHQfX3ZUXZyZLdnCQDfHZ56bzpg',
  MSTRx: 'XsP7xzNPvEHS1m6qfanPUGjNmdnmsLKEoNAnHjdxxyZ',
  GLDx: 'Xsv9hRk1z5ystj9MhnA7Lq4vjSsLwzL2nxrwmwtD3re',
  NFLXx: 'XsEH7wWfJJu2ZT3UCFeVfALnVA6CP5ur7Ee11KmzVpL',
  MCDx: 'XsqE9cRRpzxcGKDXj1BJ7Xmg4GRhZoyY1KpmGSxAWT2',
  PLTRx: 'XsoBhf2ufR8fTyNSjqfU71DYGaE6Z3SUGAidpzriAA4',
  GMEx: 'Xsf9mBktVB9BSU5kf4nHxPq5hCBJ2j2ui3ecFGxPRGc',
  STRCx: 'Xs78JED6PFZxWc2wCEPspZW9kL3Se5J7L5TChKgsidH',
  INTCx: 'XshPgPdXFRWB8tP1j82rebb2Q9rPgGX37RuqzohmArM',
  AMDx: 'XsXcJ6GZ9kVnjqGsjBnktRcuwMBmvKWh8S93RefZ1rF',
  ORCLx: 'XsjFwUPiLofddX5cWFHW35GCbXcSu1BCUGfxoQAQjeL',
  JPMx: 'XsMAqkcKsUewDrzVkait4e5u4y8REgtyS7jWgCpLV2C',
  Vx: 'XsqgsbXwWogGJsNcVZ3TyVouy2MbTkfCFhCGGGcQZ2p',
  UNHx: 'XszvaiXGPwvk2nwb3o9C1CX4K6zH8sez11E6uyup6fe',
  WMTx: 'Xs151QeqTCiuKtinzfRATnUESM2xTU6V9Wy8Vy538ci',
  KOx: 'XsaBXg8dU5cPM6ehmVctMkVqoiRG2ZjMo1cyBJ3AykQ',
  XOMx: 'XsaHND8sHyfMfsWPj6kSdd5VwvCayZvjYgKmmcNL5qh',
};

async function testQuotes() {
  console.log('Quoting 18 expansion assets on Jupiter Lite API ($2 USDC @ 50bps slippage)...');
  let passCount = 0;
  for (const [sym, mint] of Object.entries(candidates)) {
    const url = `https://lite-api.jup.ag/swap/v1/quote?inputMint=${USDC}&outputMint=${mint}&amount=2000000&slippageBps=50`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`${sym.padEnd(8)}: HTTP error ${res.status}`);
        continue;
      }
      const data = await res.json();
      const impact = Number(data.priceImpactPct || 0);
      const outAmount = data.outAmount;
      const pass = impact < 0.05 && outAmount > 0;
      if (pass) passCount++;
      console.log(`${sym.padEnd(8)}: Out=${String(outAmount).padStart(12)} Impact=${(impact * 100).toFixed(3)}% -> ${pass ? 'PASS' : 'FAIL'}`);
    } catch (e) {
      console.error(`${sym.padEnd(8)}: Error: ${e.message}`);
    }
  }
  console.log(`\nResult: ${passCount} / ${Object.keys(candidates).length} assets passed the listing gate.`);
}

testQuotes();
