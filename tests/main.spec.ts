import { Cell, toNano } from "@ton/core";
import { Blockchain, SandboxContract, TreasuryContract } from "@ton/sandbox";
import { MainContract } from "../wrappers/MainContract";
import "@ton/test-utils";
import { compile } from "@ton/blueprint";

describe("main.fc contract tests", () => {
  let blockchain: Blockchain;
  let ownerWallet: SandboxContract<TreasuryContract>;
  let initWallet: SandboxContract<TreasuryContract>;
  let myContract: SandboxContract<MainContract>;
  let codeCell: Cell;

  beforeAll(async () => {
    codeCell = await compile("MainContract");
  });

  beforeEach(async () => {
    blockchain = await Blockchain.create();
    ownerWallet = await blockchain.treasury("owner-wallet");
    initWallet = await blockchain.treasury("initWallet");
    myContract = blockchain.openContract(
      MainContract.createFromConfig(
        {
          initialCounterValue: 0,
          senderAddress: initWallet.address,
          ownerAddress: ownerWallet.address,
        },
        codeCell
      )
    );
  });
  it("should get the proper most recent sender address + counter", async () => {
    const value = toNano("0.05");
    const senderWallet = await blockchain.treasury("sender");
    const sentMessageResult = await myContract.sendIncrement(
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

    const sentMessageResult2 = await myContract.sendIncrement(
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
  it("should be able to deposit and withdraw funds", async () => {
    const value = toNano("1.5");
    const senderWallet = await blockchain.treasury("sender");
    const sentMessageResult = await myContract.sendFundsDepost(
      senderWallet.getSender(),
      value
    );
    expect(sentMessageResult.transactions).toHaveTransaction({
      from: senderWallet.address,
      to: myContract.address,
      success: true,
    });
    const balance = await myContract.getBalance();
    expect(balance).toBeGreaterThanOrEqual(Number(value) * 0.99);
    const withdrawalAmount = 0.5;
    const sentMessageResult2 = await myContract.sendWithdraw(
      ownerWallet.getSender(),
      toNano("0.01"),
      toNano(withdrawalAmount)
    );
    expect(sentMessageResult2.transactions).toHaveTransaction({
      from: myContract.address,
      to: ownerWallet.address,
      value: toNano(withdrawalAmount),
      success: true,
    });
    const balance2 = await myContract.getBalance();
    expect(balance2).toBeLessThanOrEqual(
      balance - Number(toNano(withdrawalAmount)) + Number(toNano("0.01")) // msg value
    );
    expect(balance2).toBeGreaterThanOrEqual(
      balance - Number(toNano(withdrawalAmount)) * 0.99
    );
  });

  it("successfully deposits funds", async () => {
    const value = toNano("1");
    const senderWallet = await blockchain.treasury("sender");
    const sentMessageResult = await myContract.sendFundsDepost(
      senderWallet.getSender(),
      value
    );
    expect(sentMessageResult.transactions).toHaveTransaction({
      from: senderWallet.address,
      to: myContract.address,
      success: true,
    });
    const balance = await myContract.getBalance();
    expect(balance).toBeGreaterThanOrEqual(Number(value) * 0.99);
  });
  it("should return deposit funds as no command is sent", async () => {
    const senderWallet = await blockchain.treasury("sender");

    const depositMessageResult = await myContract.sendNoCodeDeposit(
      senderWallet.getSender(),
      toNano("5")
    );

    expect(depositMessageResult.transactions).toHaveTransaction({
      from: myContract.address,
      to: senderWallet.address,
      success: true,
    });

    const balanceRequest = await myContract.getBalance();

    expect(balanceRequest).toBe(0);
  });
  it("fails to withdraw funds on behalf of non-owner", async () => {
    const senderWallet = await blockchain.treasury("sender");

    const depositMessageResult = await myContract.sendWithdraw(
      senderWallet.getSender(),
      toNano("0.1"),
      toNano("1")
    );

    expect(depositMessageResult.transactions).toHaveTransaction({
      from: senderWallet.address,
      to: myContract.address,
      success: false,
      exitCode: 35,
    });
  });
  it("fails to withdraw funds because lack of balance", async () => {
    const withdrawRequest = await myContract.sendWithdraw(
      ownerWallet.getSender(),
      toNano("0.1"),
      toNano("1")
    );
    expect(withdrawRequest.transactions).toHaveTransaction({
      from: ownerWallet.address,
      to: myContract.address,
      success: false,
      exitCode: 37,
    });
  });
});
