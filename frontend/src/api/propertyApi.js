import api from "./client";

export async function fetchProperties(params) {
  const { data } = await api.get("/properties", { params });
  return data;
}

export async function fetchPropertyById(id) {
  const { data } = await api.get(`/properties/${id}`);
  return data;
}

export async function createProperty(payload) {
  const { data } = await api.post("/properties", payload);
  return data;
}

export async function uploadImages(propertyId, files) {
  const form = new FormData();
  files.forEach((file) => form.append("images", file));
  const { data } = await api.post(`/properties/${propertyId}/images`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function reanalyzeProperty(propertyId) {
  const { data } = await api.post(`/properties/${propertyId}/reanalyze`);
  return data;
}
