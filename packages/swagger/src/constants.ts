// ============================================================================
// Swagger Package - Metadata Keys
// ============================================================================
// Using Symbol.for() to ensure symbols are shared across packages
// and different import contexts (bundlers, tests, etc.)

/**
 * Key for storing API tags on controller classes
 * Used by @ApiTags() decorator
 */
export const API_TAGS_METADATA = Symbol.for('rikta:swagger:apiTags');

/**
 * Key for storing API operation metadata on route methods
 * Used by @ApiOperation() decorator
 */
export const API_OPERATION_METADATA = Symbol.for('rikta:swagger:apiOperation');

/**
 * Key for storing API response metadata on route methods
 * Used by @ApiResponse() decorator
 */
export const API_RESPONSE_METADATA = Symbol.for('rikta:swagger:apiResponse');

/**
 * Key for storing API property metadata on class properties
 * Used by @ApiProperty() decorator
 */
export const API_PROPERTY_METADATA = Symbol.for('rikta:swagger:apiProperty');

/**
 * Key for storing API body metadata on route methods
 * Used by @ApiBody() decorator
 */
export const API_BODY_METADATA = Symbol.for('rikta:swagger:apiBody');

/**
 * Key for storing API parameter metadata on route methods
 * Used by @ApiParam() decorator
 */
export const API_PARAM_METADATA = Symbol.for('rikta:swagger:apiParam');

/**
 * Key for storing API query metadata on route methods
 * Used by @ApiQuery() decorator
 */
export const API_QUERY_METADATA = Symbol.for('rikta:swagger:apiQuery');

/**
 * Key for storing API header metadata on route methods
 * Used by @ApiHeader() decorator
 */
export const API_HEADER_METADATA = Symbol.for('rikta:swagger:apiHeader');

/**
 * Key for storing API security metadata on route methods or controllers
 * Used by @ApiSecurity() and @ApiBearerAuth() decorators
 */
export const API_SECURITY_METADATA = Symbol.for('rikta:swagger:apiSecurity');

/**
 * Key for storing API exclude metadata on route methods
 * Used by @ApiExcludeEndpoint() decorator
 */
export const API_EXCLUDE_METADATA = Symbol.for('rikta:swagger:apiExclude');

/**
 * Key for storing API deprecated metadata on route methods
 * Used when operation is marked as deprecated
 */
export const API_DEPRECATED_METADATA = Symbol.for('rikta:swagger:apiDeprecated');
