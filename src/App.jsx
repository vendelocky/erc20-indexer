import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';
import { Alchemy, Network, Utils } from 'alchemy-sdk';
import { useState } from 'react';

function App() {
  const [userAddress, setUserAddress] = useState('');
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const connectToWallet = async () => {
    if (window.ethereum) {
      await window.ethereum.request({ method: 'eth_requestAccounts' })
        .then(result => {
          // use a default account (first account)
          getTokenBalance(result[0]);
        })
    }
  };

  const getTokenBalance = async (walletAddress) => {
    setResults([]);
    setHasQueried(false);
    setIsLoading(true);
    setErrMsg('');

    const config = {
      apiKey: '', // Enter your Alchemy API Key
      network: Network.ETH_SEPOLIA,
    };

    const alchemy = new Alchemy(config);
    let data = null;
    try {
      data = await alchemy.core.getTokenBalances(walletAddress);
      setResults(data);
      const tokenDataPromises = [];
      if (data) {
        for (let i = 0; i < data?.tokenBalances?.length; i++) {
          const tokenData = alchemy.core.getTokenMetadata(
            data?.tokenBalances[i]?.contractAddress
          );
          tokenDataPromises.push(tokenData);
        }
        setTokenDataObjects(await Promise.all(tokenDataPromises));
      }
    } catch (e) {
      setErrMsg(e.message);
    }

    setHasQueried(true);
    setIsLoading(false);
  };

  return (
    <Box w="100vw">
      <Center>
        <Flex
          alignItems={'center'}
          justifyContent="center"
          flexDirection={'column'}
        >
          <Heading mb={0} fontSize={36}>
            ERC-20 Token Indexer
          </Heading>
          <Text>
            Plug in an address and this website will return all of its ERC-20
            token balances!
          </Text>
        </Flex>
      </Center>
      <Flex
        w="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent={'center'}
      >
        <Heading mt={42}>
          Get all the ERC-20 token balances of this address:
        </Heading>
        <Input
          onChange={(e) => setUserAddress(e.target.value)}
          color="black"
          w="600px"
          textAlign="center"
          p={4}
          bgColor="white"
          fontSize={24}
          placeholder={'e.g. 0xF6cf78f4C816f08e884aFB6Bd6f462a26430f689'}
        />
        <Button fontSize={20} onClick={connectToWallet} mt={36} bgColor="blue">
          Connect my wallet
        </Button>
        <Button fontSize={20} onClick={() => getTokenBalance(userAddress)} mt={36} bgColor="blue">
          Check from address
        </Button>

        <Heading my={36}>ERC-20 token balances:</Heading>

        {hasQueried ? (
          <SimpleGrid w={'100vw'} columns={4} spacing={24}>
            {results?.tokenBalances?.map((e, i) => {
              return (
                <Flex
                  flexDir={'column'}
                  color="white"
                  bg="blue"
                  w={'20vw'}
                  key={e.id}
                  style={{ padding: 8, borderRadius: 10, overflow: 'hidden' }}
                >
                  <Box style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <b>Name:</b> {tokenDataObjects[i].name}&nbsp;
                  </Box>
                  <Box style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <b>Symbol:</b> ${tokenDataObjects[i].symbol}&nbsp;
                  </Box>
                  <Box style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <b>Balance:</b>&nbsp;
                    {Utils.formatUnits(
                      e.tokenBalance,
                      tokenDataObjects[i].decimals
                    )}
                  </Box>
                  <Image src={tokenDataObjects[i].logo} />
                </Flex>
              );
            })}
          </SimpleGrid>
        ) : !isLoading ? (
          'Please make a query! This may take a few seconds...'
        ) : ('Loading the tokens...')}
        {!!errMsg && (<Text>ERROR: {errMsg}</Text>)}
        {hasQueried && !results && !errMsg && (<Text>No tokens found from the inputted address above!</Text>)}
      </Flex>
    </Box>
  );
}

export default App;
