import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';

/**
 * A generic custom hook for making API calls.
 * 
 * @param {string} baseUrl - The base API URL or endpoint.
 * @returns {object} Hook state and execute function: { data, error, isLoading, execute }
 */
export const useApi = (baseUrl) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useSelector((state) => state.auth);

  /**
   * Executes the API call.
   * 
   * @param {object} options
   * @param {string} options.method - HTTP method (e.g., 'GET', 'POST', 'PUT', 'DELETE')
   * @param {object} options.pathParams - Key-value pairs to replace in the URL path (e.g., { id: 1 } for '/users/:id')
   * @param {object} options.queryParams - Key-value pairs to append as query string parameters
   * @param {any} options.body - Payload for the request (converted to JSON unless FormData)
   * @param {object} options.headers - Custom headers to include in the request
   * @param {object} options.customConfig - Any additional fetch options (e.g., credentials, mode)
   * @returns {Promise<any>} The response data
   */
  const execute = useCallback(async (options = {}) => {
    const {
      method = 'GET',
      pathParams = {},
      queryParams = {},
      body = null,
      headers = {},
      customConfig = {}
    } = options;

    setIsLoading(true);
    setError(null);

    try {
      // 1. Process path parameters (replace :key in baseUrl)
      let url = baseUrl;
      Object.entries(pathParams).forEach(([key, value]) => {
        url = url.replace(`:${key}`, encodeURIComponent(value));
      });

      // 2. Process query parameters
      if (Object.keys(queryParams).length > 0) {
        const urlParams = new URLSearchParams();
        Object.entries(queryParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
              urlParams.append(key, value);
          }
        });
        const queryString = urlParams.toString();
        if (queryString) {
            url += `${url.includes('?') ? '&' : '?'}${queryString}`;
        }
      }

      // 3. Prepare headers
      const defaultHeaders = {};
      const isFormData = body instanceof FormData;
      
      if (!isFormData && body) {
        defaultHeaders['Content-Type'] = 'application/json';
      }

      if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
      }

      const mergedHeaders = {
        ...defaultHeaders,
        ...headers
      };

      // 4. Prepare fetch configuration
      const config = {
        method,
        headers: mergedHeaders,
        ...customConfig
      };

      if (body) {
        config.body = isFormData ? body : JSON.stringify(body);
      }

      // 5. Execute request
      const response = await fetch(url, config);
      
      let responseData;
      const contentType = response.headers.get("content-type");
      
      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        // FastAPI uses `detail`; fall back to `message` for other backends
        throw new Error(
          (responseData && responseData.detail) ||
          (responseData && responseData.message) ||
          (typeof responseData === 'string' ? responseData : 'An error occurred') ||
          response.statusText
        );
      }

      setData(responseData);
      return responseData;
    } catch (err) {
      setError(err.message || String(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl, token]);

  return { data, error, isLoading, execute };
};
