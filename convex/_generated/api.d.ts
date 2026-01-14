/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as dataExport from "../dataExport.js";
import type * as dataImport from "../dataImport.js";
import type * as devices from "../devices.js";
import type * as http from "../http.js";
import type * as migrations_import from "../migrations/import.js";
import type * as specs from "../specs.js";
import type * as stats from "../stats.js";
import type * as topology from "../topology.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  dataExport: typeof dataExport;
  dataImport: typeof dataImport;
  devices: typeof devices;
  http: typeof http;
  "migrations/import": typeof migrations_import;
  specs: typeof specs;
  stats: typeof stats;
  topology: typeof topology;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
