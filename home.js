// ---------------- Wallet + Contract Setup ----------------
let provider, signer, userAddress, contract;

// 🔹 Replace with your deployed contract address
const contractAddress = "0x4E5D6065cc00eaB640Bc877bA18a2D94be7e0EC4";

// 🔹 ABI (only what we need)
const contractABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

// Example conversion rate: 1 TP = ₹2
const TP_TO_INR = 2;

async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask not detected. Please install it.");
    return;
  }

  try {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();

    // Connect to contract
    contract = new ethers.Contract(contractAddress, contractABI, signer);

    // Fetch and display balance
    await updateBalance();
  } catch (err) {
    console.error(err);
    alert("Failed to connect wallet");
  }
}

async function updateBalance() {
  try {
    const rawBalance = await contract.balanceOf(userAddress);
    const decimals = await contract.decimals();
    const tpBalance = parseFloat(ethers.utils.formatUnits(rawBalance, decimals));

    // Update UI
    document.getElementById("points-badge").innerText = `${tpBalance} TP`;
    document.getElementById("wallet-pill").innerText =
      `Wallet: ₹${tpBalance * TP_TO_INR}`;
  } catch (err) {
    console.error("Error fetching balance:", err);
  }
}

// ---------------- Search & UI Logic ----------------
function setupSearch() {
  const searchBtn = document.getElementById("search-btn");
  const searchInput = document.getElementById("search-input");

  if (searchBtn && searchInput) {
    searchBtn.addEventListener("click", () => {
      const query = searchInput.value.trim();
      if (query) {
        window.location.href = `artist.html?search=${encodeURIComponent(query)}`;
      }
    });
  }
}

// ---------------- Init ----------------
window.addEventListener("load", () => {
  connectWallet();   // auto-connect MetaMask and fetch balance
  setupSearch();     // setup artist search
});
