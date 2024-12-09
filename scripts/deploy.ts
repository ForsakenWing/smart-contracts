import { address, toNano } from "@ton/core";
import { MainContract } from "../wrappers/MainContract";
import { compile, NetworkProvider } from "@ton/blueprint";

export async function run(provider: NetworkProvider) {
  const myContract = MainContract.createFromConfig(
    {
      initialCounterValue: 0,
      senderAddress: address(
        "0QB4zHtKedAfTAaHXmatzN1yZJSm1z03Wx5vHcvkzqFUfuaY"
      ),
      ownerAddress: address("0QB4zHtKedAfTAaHXmatzN1yZJSm1z03Wx5vHcvkzqFUfuaY"),
    },
    await compile("MainContract")
  );

  const openedContract = provider.open(myContract);

  openedContract.sendDeploy(provider.sender(), toNano("0.05"));

  await provider.waitForDeploy(myContract.address);
}
