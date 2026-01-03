/**
 * Swagger decorators barrel export
 * 
 * @packageDocumentation
 */

// Tag decorator
export { ApiTags, getApiTags } from './api-tags.decorator.js';

// Operation decorator
export { ApiOperation, getApiOperation } from './api-operation.decorator.js';

// Response decorators
export {
  ApiResponse,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiAcceptedResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiUnprocessableEntityResponse,
  ApiInternalServerErrorResponse,
  getApiResponses,
} from './api-response.decorator.js';

// Body decorator
export { ApiBody, getApiBody } from './api-body.decorator.js';

// Parameter decorators
export { ApiParam, getApiParams } from './api-param.decorator.js';
export { ApiQuery, getApiQueries } from './api-query.decorator.js';
export { ApiHeader, getApiHeaders } from './api-header.decorator.js';

// Security decorators
export {
  ApiSecurity,
  ApiBearerAuth,
  ApiBasicAuth,
  ApiOAuth2,
  ApiCookieAuth,
  getApiSecurity,
} from './api-security.decorator.js';

// Property decorators
export {
  ApiProperty,
  ApiPropertyOptional,
  ApiHideProperty,
  getApiProperties,
} from './api-property.decorator.js';

// Exclude/Deprecate decorators
export {
  ApiExcludeEndpoint,
  ApiExcludeController,
  isApiExcluded,
  ApiDeprecated,
  getApiDeprecated,
} from './api-exclude.decorator.js';
