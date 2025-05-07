'use client'

import { useAccount, useConnect, useDisconnect, useSendTransaction, useSignMessage } from 'wagmi'
import { useState, useEffect } from 'react'
import { parseEther } from 'viem'

type UserProof = {
  timestamp: number;
  name: string;
  owner: string;
  signature: string;
  fid: number;
  type: string;
};

type ProofResponse = {
  proofs: UserProof[];
};

type NeighborInfo = {
  fid: number;
  owner: string;
  name?: string;
};

function App() {
  const account = useAccount()
  const { connectors, connect, status, error } = useConnect()
  const { disconnect } = useDisconnect()
  const { sendTransactionAsync, data: txData } = useSendTransaction()
  const { signMessage, data: signData } = useSignMessage()
  const [truncatedAddress, setTruncatedAddress] = useState<string>('')
  const [txError, setTxError] = useState<string | null>(null)
  const [fid, setFid] = useState<string>('')
  const [fidSubmitted, setFidSubmitted] = useState<boolean>(false)
  const [neighbors, setNeighbors] = useState<NeighborInfo[]>([])
  const [isLoadingNeighbors, setIsLoadingNeighbors] = useState<boolean>(false)
  const [neighborError, setNeighborError] = useState<string | null>(null)
  const [tipAmount, setTipAmount] = useState<string>('0.0000001')
  const [tippingFid, setTippingFid] = useState<number | null>(null)
  const [loadingProgress, setLoadingProgress] = useState<number>(0)
  const [totalToLoad, setTotalToLoad] = useState<number>(11) // 5 below + current + 5 above

  useEffect(() => {
    if (account.addresses && account.addresses[0]) {
      const addr = account.addresses[0]
      setTruncatedAddress(`${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`)
    } else {
      setTruncatedAddress('')
    }
  }, [account.addresses])

  const handleSendTransaction = async (targetAddress: `0x${string}`, amount: string) => {
    try {
      setTxError(null) // Clear previous errors
      setTippingFid(null)
      console.log(`Attempting to send ${amount} ETH to ${targetAddress}...`)
      const result = await sendTransactionAsync({
        to: targetAddress,
        value: parseEther(amount),
      })
      console.log("Transaction successful:", result)
    } catch (err) {
      console.error("Transaction failed:", err)
      setTxError(err instanceof Error ? err.message : String(err))
    }
  }

  const fetchUserData = async (fidNumber: number): Promise<NeighborInfo | null> => {
    try {
      console.log(`Attempting to fetch data for FID: ${fidNumber}`);
      const response = await fetch(`/api/farcaster?fid=${fidNumber}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch FID ${fidNumber}: Status ${response.status}`);
      }
      
      const data: ProofResponse = await response.json();
      console.log(`Response for FID ${fidNumber}:`, data);
      
      if (data.proofs && data.proofs.length > 0) {
        const proof = data.proofs[0]; // Use the first proof
        return {
          fid: proof.fid,
          owner: proof.owner,
          name: proof.name
        };
      }
      return null;
    } catch (error) {
      console.error(`Error fetching FID ${fidNumber}:`, error);
      return null;
    }
  };

  const fetchNeighboringAddresses = async (fidNumber: number) => {
    setIsLoadingNeighbors(true);
    setNeighborError(null);
    setLoadingProgress(0);
    const results: NeighborInfo[] = [];
    
    try {
      console.log("Starting to fetch neighboring addresses for FID:", fidNumber);
      
      // Fetch 5 FIDs below
      for (let i = fidNumber - 5; i < fidNumber; i++) {
        if (i > 0) {
          const data = await fetchUserData(i);
          setLoadingProgress(prev => prev + 1);
          if (data) {
            console.log(`Found neighbor FID ${i}:`, data);
            results.push(data);
          } else {
            console.log(`No data found for FID ${i}`);
          }
        }
      }
      
      // Fetch the input FID itself
      const currentFid = await fetchUserData(fidNumber);
      setLoadingProgress(prev => prev + 1);
      if (currentFid) {
        console.log(`Found current FID ${fidNumber}:`, currentFid);
        results.push(currentFid);
      } else {
        console.log(`No data found for your FID ${fidNumber}`);
        setNeighborError(`No data found for FID ${fidNumber}. Please check if this FID exists.`);
      }
      
      // Fetch 5 FIDs above
      for (let i = fidNumber + 1; i <= fidNumber + 5; i++) {
        const data = await fetchUserData(i);
        setLoadingProgress(prev => prev + 1);
        if (data) {
          console.log(`Found neighbor FID ${i}:`, data);
          results.push(data);
        } else {
          console.log(`No data found for FID ${i}`);
        }
      }
      
      console.log("Total neighbors found:", results.length);
      if (results.length === 0) {
        setNeighborError("No neighbors found. Try a different FID range.");
      } else {
        setNeighbors(results);
      }
    } catch (error) {
      console.error("Error fetching neighboring addresses:", error);
      setNeighborError("Failed to fetch neighboring addresses");
    } finally {
      setIsLoadingNeighbors(false);
    }
  };

  const handleFidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fid.trim()) {
      const fidNumber = parseInt(fid, 10);
      if (isNaN(fidNumber) || fidNumber <= 0) {
        setNeighborError("Please enter a valid FID (positive number)");
        return;
      }
      
      setFidSubmitted(true);
      console.log("FID submitted:", fidNumber);
      fetchNeighboringAddresses(fidNumber);
    } else {
      setNeighborError("Please enter a FID");
    }
  };

  const handleTipClick = (neighborFid: number, address: string) => {
    setTippingFid(neighborFid);
  };

  const sendTip = (address: string) => {
    // Convert to proper Ethereum address format
    const ethAddress = address as `0x${string}`;
    handleSendTransaction(ethAddress, tipAmount);
  };

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>Tip ur Neighbor</h1>
        <p>Connect your wallet to start tipping your neighbors</p>
      </div>

      <div className="card">
        <h2>Account Status</h2>
        
        {account.status === 'connected' ? (
          <>
            <div className="account-info">
              <div><strong>Address:</strong> {truncatedAddress}</div>
              <div><strong>Chain:</strong> {account.chainId ? `Chain ID: ${account.chainId}` : 'Not connected'}</div>
            </div>
            
            <button type="button" onClick={() => disconnect()}>
              Disconnect Wallet
            </button>
          </>
        ) : (
          <div className={`status-message ${account.status === 'reconnecting' ? 'connecting' : ''}`}>
            {account.status === 'reconnecting' 
              ? 'Attempting to reconnect...' 
              : 'Not connected. Please connect your wallet below.'}
          </div>
        )}
      </div>

      {account.status !== 'connected' && (
        <div className="card">
          <h2>Connect Your Wallet</h2>
          <p>Select your preferred wallet to continue:</p>
          
          <div className="connector-buttons">
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                onClick={() => connect({ connector })}
                type="button"
                disabled={status === 'pending'}
              >
                {connector.name}
                {status === 'pending' && ' (Connecting...)'}
              </button>
            ))}
          </div>
          
          {status === 'pending' && (
            <div className="status-message connecting">
              Connecting to wallet...
            </div>
          )}
          
          {error && (
            <div className="status-message error">
              Error: {error.message}
            </div>
          )}
        </div>
      )}

      {account.status === 'connected' && (
        <>
          <div className="card">
            <h2>Sign Message</h2>
            <p>Sign a message to verify your identity:</p>
            
            <button
              type="button"
              onClick={() => signMessage({ message: 'Tip ur Neighbor' })}
            >
              Sign Message
            </button>
            
            {signData && (
              <div className="status-message connected">
                Message signed successfully!
                <div className="account-info">
                  <small>{signData}</small>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <h2>Submit FID</h2>
            <p>Enter your Farcaster ID (FID) to find your neighbors:</p>
            
            <form onSubmit={handleFidSubmit}>
              <input
                type="text"
                value={fid}
                onChange={(e) => setFid(e.target.value)}
                placeholder="Enter your FID"
                title="Enter a numeric Farcaster ID (e.g., 822727)"
                required
                className="fid-input"
              />
              <button type="submit" disabled={isLoadingNeighbors}>
                {isLoadingNeighbors ? 'Loading...' : 'Submit FID'}
              </button>
            </form>
            
            <p className="fid-help">
              <small>Example FID: 822727 (for user xppaicyber.eth). FIDs are numeric identifiers on Farcaster.</small>
            </p>
            
            {fidSubmitted && (
              <div className="status-message connected">
                FID successfully submitted! 🎉
                <div className="account-info">
                  <small>FID: {fid}</small>
                </div>
              </div>
            )}
            
            {isLoadingNeighbors && (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <div className="loading-text">
                  Loading neighboring addresses... ({loadingProgress}/{totalToLoad})
                </div>
                <div className="loading-progress-bar">
                  <div 
                    className="loading-progress-fill" 
                    style={{ width: `${(loadingProgress / totalToLoad) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {neighborError && (
              <div className="status-message error">
                {neighborError}
              </div>
            )}
            
            {neighbors.length > 0 && (
              <div className="neighbors-container">
                <h3>Neighboring FIDs</h3>
                <div className="tip-settings">
                  <label htmlFor="tipAmount">Tip Amount (ETH):</label>
                  <input
                    type="text"
                    id="tipAmount"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    className="tip-amount-input"
                  />
                </div>
                <div className="neighbors-list">
                  {neighbors.map((neighbor, index) => (
                    <div key={index} className={`neighbor-item ${parseInt(fid, 10) === neighbor.fid ? 'current-fid' : ''}`}>
                      <div className="neighbor-info">
                        <div><strong>FID:</strong> {neighbor.fid}</div>
                        {/* <div><strong>Owner:</strong> {neighbor.owner}</div> */}
                        {neighbor.name && <div><strong>Name:</strong> {neighbor.name}</div>}
                      </div>
                      
                      {parseInt(fid, 10) !== neighbor.fid && (
                        <div className="neighbor-actions">
                          {tippingFid === neighbor.fid ? (
                            <>
                              <div className="confirm-tip">
                                <span>Send {tipAmount} ETH to FID {neighbor.fid}?</span>
                                <div className="confirm-buttons">
                                  <button 
                                    type="button" 
                                    onClick={() => sendTip(neighbor.owner)}
                                    className="confirm-button"
                                  >
                                    Confirm
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => setTippingFid(null)}
                                    className="cancel-button"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </>
                          ) : (
                            <button 
                              type="button" 
                              onClick={() => handleTipClick(neighbor.fid, neighbor.owner)}
                              className="tip-button"
                            >
                              Tip
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {txData && (
              <div className="status-message connected">
                Transaction sent successfully! 🎉
                <div className="account-info">
                  <small>{txData}</small>
                </div>
              </div>
            )}
            
            {txError && (
              <div className="status-message error">
                Transaction failed: {txError}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default App