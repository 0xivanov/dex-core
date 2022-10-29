/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type {
  FunctionFragment,
  Result,
  EventFragment,
} from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "../../common";

export interface IDexPoolFactoryInterface extends utils.Interface {
  functions: {
    "claimOwnership()": FunctionFragment;
    "createPool(address,address,address,uint256)": FunctionFragment;
    "getPool(address,address,uint256)": FunctionFragment;
    "owner()": FunctionFragment;
    "pendingOwner()": FunctionFragment;
    "transferOwnership(address,bool)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "claimOwnership"
      | "createPool"
      | "getPool"
      | "owner"
      | "pendingOwner"
      | "transferOwnership"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "claimOwnership",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "createPool",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<BigNumberish>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "getPool",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<BigNumberish>
    ]
  ): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "pendingOwner",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [PromiseOrValue<string>, PromiseOrValue<boolean>]
  ): string;

  decodeFunctionResult(
    functionFragment: "claimOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "createPool", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "getPool", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "pendingOwner",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;

  events: {
    "OwnershipTransfered(address,address)": EventFragment;
    "PoolCreated(address,address,uint256,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "OwnershipTransfered"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "PoolCreated"): EventFragment;
}

export interface OwnershipTransferedEventObject {
  oldOwner: string;
  newOwner: string;
}
export type OwnershipTransferedEvent = TypedEvent<
  [string, string],
  OwnershipTransferedEventObject
>;

export type OwnershipTransferedEventFilter =
  TypedEventFilter<OwnershipTransferedEvent>;

export interface PoolCreatedEventObject {
  token0: string;
  token1: string;
  fee: BigNumber;
  pool: string;
}
export type PoolCreatedEvent = TypedEvent<
  [string, string, BigNumber, string],
  PoolCreatedEventObject
>;

export type PoolCreatedEventFilter = TypedEventFilter<PoolCreatedEvent>;

export interface IDexPoolFactory extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: IDexPoolFactoryInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    claimOwnership(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    createPool(
      initialImplementation: PromiseOrValue<string>,
      tokenA: PromiseOrValue<string>,
      tokenB: PromiseOrValue<string>,
      fee: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    getPool(
      tokenA: PromiseOrValue<string>,
      tokenB: PromiseOrValue<string>,
      fee: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[string] & { pool: string }>;

    owner(overrides?: CallOverrides): Promise<[string]>;

    pendingOwner(overrides?: CallOverrides): Promise<[string]>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      direct: PromiseOrValue<boolean>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  claimOwnership(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  createPool(
    initialImplementation: PromiseOrValue<string>,
    tokenA: PromiseOrValue<string>,
    tokenB: PromiseOrValue<string>,
    fee: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  getPool(
    tokenA: PromiseOrValue<string>,
    tokenB: PromiseOrValue<string>,
    fee: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<string>;

  owner(overrides?: CallOverrides): Promise<string>;

  pendingOwner(overrides?: CallOverrides): Promise<string>;

  transferOwnership(
    newOwner: PromiseOrValue<string>,
    direct: PromiseOrValue<boolean>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    claimOwnership(overrides?: CallOverrides): Promise<void>;

    createPool(
      initialImplementation: PromiseOrValue<string>,
      tokenA: PromiseOrValue<string>,
      tokenB: PromiseOrValue<string>,
      fee: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<string>;

    getPool(
      tokenA: PromiseOrValue<string>,
      tokenB: PromiseOrValue<string>,
      fee: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<string>;

    owner(overrides?: CallOverrides): Promise<string>;

    pendingOwner(overrides?: CallOverrides): Promise<string>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      direct: PromiseOrValue<boolean>,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "OwnershipTransfered(address,address)"(
      oldOwner?: PromiseOrValue<string> | null,
      newOwner?: null
    ): OwnershipTransferedEventFilter;
    OwnershipTransfered(
      oldOwner?: PromiseOrValue<string> | null,
      newOwner?: null
    ): OwnershipTransferedEventFilter;

    "PoolCreated(address,address,uint256,address)"(
      token0?: PromiseOrValue<string> | null,
      token1?: PromiseOrValue<string> | null,
      fee?: PromiseOrValue<BigNumberish> | null,
      pool?: null
    ): PoolCreatedEventFilter;
    PoolCreated(
      token0?: PromiseOrValue<string> | null,
      token1?: PromiseOrValue<string> | null,
      fee?: PromiseOrValue<BigNumberish> | null,
      pool?: null
    ): PoolCreatedEventFilter;
  };

  estimateGas: {
    claimOwnership(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    createPool(
      initialImplementation: PromiseOrValue<string>,
      tokenA: PromiseOrValue<string>,
      tokenB: PromiseOrValue<string>,
      fee: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    getPool(
      tokenA: PromiseOrValue<string>,
      tokenB: PromiseOrValue<string>,
      fee: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<BigNumber>;

    pendingOwner(overrides?: CallOverrides): Promise<BigNumber>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      direct: PromiseOrValue<boolean>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    claimOwnership(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    createPool(
      initialImplementation: PromiseOrValue<string>,
      tokenA: PromiseOrValue<string>,
      tokenB: PromiseOrValue<string>,
      fee: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    getPool(
      tokenA: PromiseOrValue<string>,
      tokenB: PromiseOrValue<string>,
      fee: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    pendingOwner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      direct: PromiseOrValue<boolean>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}