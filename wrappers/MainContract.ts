import {
  Address,
  beginCell,
  Cell,
  Contract,
  contractAddress,
  ContractProvider,
  Sender,
  SendMode,
} from "@ton/core";

export type MainContractConfig = {
  initialCounterValue: number;
  senderAddress: Address;
  ownerAddress: Address;
};

export function storeMainContractConfig(config: MainContractConfig) {
  return beginCell()
    .storeUint(config.initialCounterValue, 32)
    .storeAddress(config.senderAddress)
    .storeAddress(config.ownerAddress)
    .endCell();
}

export class MainContract implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {}

  static createFromConfig(
    config: MainContractConfig,
    code: Cell,
    workchain = 0
  ) {
    const data = storeMainContractConfig(config);
    const init = { code, data };
    const address = contractAddress(workchain, init);
    return new MainContract(address, init);
  }

  async sendIncrement(
    provider: ContractProvider,
    sender: Sender,
    value: bigint,
    increment_by = 1
  ) {
    const msg_body = beginCell()
      .storeUint(1, 32)
      .storeUint(increment_by, 32)
      .endCell();
    await provider.internal(sender, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: msg_body,
    });
  }

  async sendFundsDepost(
    provider: ContractProvider,
    sender: Sender,
    value: bigint
  ) {
    const msg_body = beginCell().storeUint(2, 32).endCell();
    await provider.internal(sender, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: msg_body,
    });
  }

  async sendWithdraw(
    provider: ContractProvider,
    sender: Sender,
    msgValue: bigint,
    withdrawAmount: bigint
  ) {
    const msg_body = beginCell()
      .storeUint(3, 32)
      .storeCoins(withdrawAmount)
      .endCell();
    await provider.internal(sender, {
      value: msgValue,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: msg_body,
    });
  }

  async getData(provider: ContractProvider) {
    const { stack } = await provider.get("get_contract_data", []);
    return {
      counter: stack.readNumber(),
      recent_sender: stack.readAddress(),
      owner_address: stack.readAddress(),
    };
  }

  async getBalance(provider: ContractProvider) {
    const { stack } = await provider.get("balance", []);
    return stack.readNumber();
  }
}
