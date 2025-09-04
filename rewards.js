// ---------------- Wallet + Contract Setup ----------------
const contractAddress = "0x4E5D6065cc00eaB640Bc877bA18a2D94be7e0EC4"; // replace with yours
const contractABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function mint(address to, uint256 amount)",
  "function burn(uint256 amount)"
];

let provider, signer, contract, account;

// Connect wallet
async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask not found. Please install it.");
    return;
  }

  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  account = await signer.getAddress();
  contract = new ethers.Contract(contractAddress, contractABI, signer);

  updateBalance();
}

// Fetch balance
async function updateBalance() {
  if (!contract || !account) return;
  const rawBalance = await contract.balanceOf(account);
  const decimals = await contract.decimals();
  const formatted = ethers.utils.formatUnits(rawBalance, decimals);

  document.getElementById("tp-balance").innerText = `${formatted} TP`;
  document.getElementById("inr-balance").innerText = `₹${formatted * 2}`; // conversion rate: 1 TP = ₹2
}

// Redeem reward
async function redeemReward(cost, rewardName) {
  if (!account) {
    await connectWallet();
  }

  const decimals = await contract.decimals();
  const rawBalance = await contract.balanceOf(account);
  const balance = parseFloat(ethers.utils.formatUnits(rawBalance, decimals));

  if (balance < cost) {
    alert("❌ Not enough Telco Points!");
    return;
  }

  try {
    const tx = await contract.burn(
      ethers.utils.parseUnits(cost.toString(), decimals)
    );
    await tx.wait();
    await updateBalance();
    alert(`✅ Redeemed: ${rewardName}`);
  } catch (err) {
    alert("❌ Redemption failed: " + err.message);
  }
}

// ---------------- Event Binding ----------------
document.addEventListener("DOMContentLoaded", () => {
  // Add redeem button listeners
  document.querySelectorAll("button[data-cost]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const cost = parseInt(btn.dataset.cost);
      const reward = btn.dataset.reward;
      await redeemReward(cost, reward);
    });
  });

// Connect button
  document.getElementById("connectButton").addEventListener("click", connectWallet);
});
