const API_URL = '/api';

export const api = {
  // Products
  getProducts: () => fetch(`${API_URL}/products`).then(res => res.json()),
  createProduct: (product: any) => fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  }).then(res => res.json()),
  updateProduct: (id: string, product: any) => fetch(`${API_URL}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  }).then(res => res.json()),
  deleteProduct: (id: string) => fetch(`${API_URL}/products/${id}`, {
    method: 'DELETE'
  }).then(res => res.json()),

  // Customers
  getCustomers: () => fetch(`${API_URL}/customers`).then(res => res.json()),
  createCustomer: (customer: any) => fetch(`${API_URL}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customer)
  }).then(res => res.json()),
  updateCustomer: (id: string, customer: any) => fetch(`${API_URL}/customers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customer)
  }).then(res => res.json()),
  deleteCustomer: (id: string) => fetch(`${API_URL}/customers/${id}`, {
    method: 'DELETE'
  }).then(res => res.json()),

  // Orders
  getOrders: () => fetch(`${API_URL}/orders`).then(res => res.json()),
  createOrder: (order: any) => fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  }).then(res => res.json()),
  deleteOrder: (id: string) => fetch(`${API_URL}/orders/${id}`, {
    method: 'DELETE'
  }).then(res => res.json()),

  // Settings
  getSettings: () => fetch(`${API_URL}/settings`).then(res => res.json()),
  updateSettings: (settings: any) => fetch(`${API_URL}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  }).then(res => res.json()),

  // Returns
  getReturns: () => fetch(`${API_URL}/returns`).then(res => res.json()),
  createReturn: (returnData: any) => fetch(`${API_URL}/returns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(returnData)
  }).then(res => res.json()),
  deleteReturn: (id: string) => fetch(`${API_URL}/returns/${id}`, {
    method: 'DELETE'
  }).then(res => res.json()),

  // Users
  getUsers: () => fetch(`${API_URL}/users`).then(res => res.json()),
  createUser: (user: any) => fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  }).then(res => res.json()),
  updateUser: (id: string, user: any) => fetch(`${API_URL}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  }).then(res => res.json()),
  deleteUser: (id: string) => fetch(`${API_URL}/users/${id}`, {
    method: 'DELETE'
  }).then(res => res.json()),
};
