import { Cell, toNano } from "@ton/core";
import { hex } from "../build/main.compiled.json";
import { Blockchain } from "@ton/sandbox";
import { MainContract } from "../wrappers/MainContract";
import "@ton/test-utils";

describe("main.fc contract tests", () => {
  it("should get the proper most recent sender address", async () => {
    const blockchain = await Blockchain.create();
    const codeCell = Cell.fromBoc(Buffer.from(hex, "hex"))[0];
    const treasury = await blockchain.treasury("initial-treasury");
    const myContract = blockchain.openContract(
      MainContract.createFromConfig(
        {
          initialCounterValue: 0,
          senderAddress: treasury.address,
        },
        codeCell
      )
    );
    const value = toNano("0.05");
    const senderWallet = await blockchain.treasury("sender");
    const sentMessageResult = await myContract.sendInternalMessage(
      senderWallet.getSender(),
      value,
      3
    );
    expect(sentMessageResult.transactions).toHaveTransaction({
      from: senderWallet.address,
      to: myContract.address,
      success: true,
    });

    const data = await myContract.getData();

    expect(data.recent_sender.toString()).toBe(senderWallet.address.toString());
    expect(data.counter).toEqual(3);

    const sentMessageResult2 = await myContract.sendInternalMessage(
      senderWallet.getSender(),
      toNano("0.1"),
      5
    );
    expect(sentMessageResult2.transactions).toHaveTransaction({
      from: senderWallet.address,
      to: myContract.address,
      success: true,
    });

    const data2 = await myContract.getData();
    expect(data2.recent_sender.toString()).toBe(
      senderWallet.address.toString()
    );
    expect(data2.counter).toEqual(8);
  });
});
