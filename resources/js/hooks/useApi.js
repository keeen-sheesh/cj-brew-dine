import { useState, useCallback } from 'react';
import api from '@/utils/api';

/**
 * Custom hook for making API calls
 */
export const useApi = (options) => {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null,
  });

  const request = useCallback(
    async (method, url, data) => {
      setState({ data: null, loading: true, error: null });
      try {
        const response = await api({
          method,
          url,
          data,
        });
        setState({ data: response.data, loading: false, error: null });
        options?.onSuccess?.(response.data);
        return response.data;
      } catch (error) {
        setState({ data: null, loading: false, error: error });
        options?.onError?.(error);
        throw error;
      }
    },
    [options]
  );

  const get = useCallback((url) => request('get', url), [request]);
  const post = useCallback((url, data) => request('post', url, data), [request]);
  const put = useCallback((url, data) => request('put', url, data), [request]);
  const patch = useCallback((url, data) => request('patch', url, data), [request]);
  const del = useCallback((url) => request('delete', url), [request]);

  return {
    ...state,
    get,
    post,
    put,
    patch,
    delete: del,
    request,
  };
};

/**
 * Custom hook for fetching list of items with pagination
 */
export const useFetchList = (url, options) => {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total: 0,
    per_page: 15,
    last_page: 1,
  });
  const { data, loading, error, get } = useApi(options);

  const fetch = useCallback(
    async (page = 1, params = {}) => {
      try {
        const response = await get(`${url}?page=${page}&${new URLSearchParams(params)}`);
        setItems(response.data);
        setPagination(response.meta);
      } catch (err) {
        console.error('Failed to fetch list:', err);
      }
    },
    [url, get]
  );

  return {
    items,
    pagination,
    loading,
    error,
    fetch,
  };
};
