import React, { useState, useEffect } from "react";

import miningABI from "./miningABI.json"; // Replace with your contract ABI JSON file
import creditABI from "./creditABI.json"; // Replace with your contract ABI JSON file
import oreABI from "./oreABI.json"; // Replace with your contract ABI JSON file

const ethers = require("ethers");
const MINING_CONTRACT = "0x3ef374D4588ed56c1736653476afF42eeAB208E7"; // Replace with your contract address
const CREDIT_CONTRACT = "0xce9D4210F419f15079bDBaAA0035FdDc4c47565b"; // Replace with your contract address
const ORE_CONTRACT = "0x1bF7b3F9D1167A3824f8e6Bb38EC68035DE631C7"; // Replace with your contract address

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  const [miningContract, setMiningContract] = useState(null);
  const [creditContract, setCreditContract] = useState(null);
  const [oreContract, setOreContract] = useState(null);

  const [account, setAccount] = useState("");
  const [oreBalance, setOreBalance] = useState(0);
  const [creditBalance, setCreditBalance] = useState(0);
  const [smeltStatus, setSmeltStatus] = useState(null);


  const [currentBlockTime, setCurrentBlockTime] = useState(0);

  // Connect to MetaMask
  const connectWallet = async () => {
    if (window.ethereum) {
      // Initialize a new ethers provider for MetaMask
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      await newProvider.send("eth_requestAccounts", []);
      const newSigner = await newProvider.getSigner();
      const userAccount = await newSigner.getAddress();

      setProvider(newProvider);
      setSigner(newSigner);
      setAccount(userAccount);

      // Load contract
      const miningContract = new ethers.Contract(MINING_CONTRACT, miningABI, newSigner);
      const creditContract = new ethers.Contract(CREDIT_CONTRACT, creditABI, newSigner);
      const oreContract = new ethers.Contract(ORE_CONTRACT, oreABI, newSigner);

      setMiningContract(miningContract);
      setCreditContract(creditContract);
      setOreContract(oreContract);

      // Fetch balances after contracts are set
      await fetchBalances();

    } else {
      alert("MetaMask not found. Please install MetaMask.");
    }
  };

  // Fetch Ore and Credit balances
  const fetchBalances = async () => {
    if (!oreContract || !account) return;

    try {
      const oreBalance = await oreContract.balanceOf(account);
      const creditBalance = await creditContract.balanceOf(account);

      setOreBalance(ethers.formatEther(oreBalance));
      setCreditBalance(ethers.formatEther(creditBalance));

    } catch (error) {
      console.error("Error fetching Ore balance:", error);
    }
  };

  // Approve Ore Tokens for the Mining Contract
  const approveOreTokens = async () => {
    const smeltingOreRequirement = ethers.parseUnits("1", 18); // Adjust as per the contract's requirement

    try {
      const tx = await oreContract.approve(MINING_CONTRACT, smeltingOreRequirement);
      await tx.wait();
      console.log("Ore token approval successful.");
    } catch (error) {
      console.error("Error approving Ore token:", error);
    }
  };

  // Start Smelting Process
  const startSmelting = async () => {
    if (!miningContract) return;

    try {
      const amountToApprove = ethers.parseUnits("1", 18); // Adjust amount and decimals as needed

      // Approve the contract to spend the tokens
      const approveTx = await oreContract.approve(MINING_CONTRACT, amountToApprove);
      await approveTx.wait();
      console.log("Token approved successfully!");

      const tx = await miningContract.startSmelting();
      await tx.wait();
      console.log("Smelting started successfully!");
    } catch (error) {
      console.error("Error starting smelting:", error);
    }
  };

  const completeSmelting = async () => {
    if (!miningContract) return;

    try {
      const tx = await miningContract.completeSmelting();
      await tx.wait();
      console.log("Smelting ended successfully!");
    } catch (error) {
      console.error("Error ending smelting:", error);
    }
  };


  // Check if smelting is ongoing for the user
  const checkSmeltingStatus = async () => {
    if (miningContract) {
      try {
        const smeltEntry = await miningContract.smeltQueue(account);
        console.log(smeltEntry);
        if (smeltEntry) {
          setSmeltStatus({
            oreAmount: ethers.formatEther(smeltEntry.oreAmount),
            creditAmount: ethers.formatEther(smeltEntry.creditAmount),
            startTime: smeltEntry.startTime.toString(),
          });
        } else {
          setSmeltStatus(null);
        }
      } catch (error) {
        console.error("Error fetching smelting status:", error);
      }
    }
  };

  const getCurrentBlockTime = async () => {
    try {
      const latestBlock = await provider.getBlock("latest");
      const blockTime = latestBlock.timestamp;
      console.log("Current block time:", blockTime);
  
      // You can also store this in component state if needed
      setCurrentBlockTime(blockTime);
    } catch (error) {
      console.error("Error fetching current block time:", error);
    }
  };

  const mine = async () => {
    if (!miningContract) return;

    try {
      const tx = await miningContract.mine();
      const receipt = await tx.wait();
      console.log("mined successfully: ", receipt);
    } catch (error) {
      console.error("Error ending smelting:", error);
    }
  };

  const mineBatch = async () => {
    if (!miningContract) return;

    try {
      const tx = await miningContract.mineBatch(100);
      const receipt = await tx.wait();
      console.log("Batch mined successfully: ", receipt);
    } catch (error) {
      console.error("Error ending smelting:", error);
    }
  };

  useEffect(() => {
    if (signer && miningContract && oreContract) {
      fetchBalances();
      getCurrentBlockTime();
    }
  }, [signer]);

  return (
    <div>
      <h1>WOB Mining & Smelting</h1>
      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <div>
          <p>Connected as: {account}</p>
          <p>Ore Balance: {oreBalance}</p>
          <p>Credit Balance: {creditBalance}</p>
          <p>currentBlockTime: {currentBlockTime}</p>

          <button onClick={() => {
            startSmelting()
          }}>Start Smelting</button>

          <button onClick={() => {
            completeSmelting()
          }}>End Smelting</button>

          <button onClick={() => {
            mine()
          }}>Start Mine</button>

          <button onClick={() => {
            mineBatch()
          }}>Mine Batch 100</button>

          <button onClick={checkSmeltingStatus}>Check Smelting Status</button>
          {smeltStatus ? (
            <div>
              <h3>Smelting Status</h3>
              <p>Ore Amount: {smeltStatus.oreAmount}</p>
              <p>Credit Amount: {smeltStatus.creditAmount}</p>
              <p>Start Time: {smeltStatus.startTime}</p>
            </div>
          ) : (
            <p>No ongoing smelting.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;