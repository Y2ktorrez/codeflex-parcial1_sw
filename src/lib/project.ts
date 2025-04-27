import api from "./axios";

export interface CreateProjectPayload {
  name: string;
  description: string;
}

export interface CreateProjectResponse {
  message: string;
  room_id: string;
  invitation_link: string;
}

export const createProject = async (
  payload: CreateProjectPayload,
  accessToken: string
): Promise<CreateProjectResponse> => {
  const response = await api.post<CreateProjectResponse>(
    "/projects/create/",
    payload,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return response.data;
};
