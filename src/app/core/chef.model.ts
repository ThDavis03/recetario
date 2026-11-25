export interface Chef {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  image: string;
  company: {
    title: string;
    department: string;
  };
}

export interface ChefResponse {
  users: Chef[];
  total: number;
  skip: number;
  limit: number;
}

