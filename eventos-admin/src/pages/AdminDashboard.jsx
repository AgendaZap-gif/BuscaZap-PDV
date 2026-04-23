import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { MaterialIcons } from "@expo/vector-icons";
import { ImageUploader } from "@/components/image-uploader";

interface Event {
  id: string;
  name: string;
  location: string;
  date: string;
  bannerUrl?: string;
  logoUrl?: string;
  numVisitantes: number;
  numExpositores: number;
}

export default function AdminGlobalDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [events, setEvents] = useState<Event[]>([
    {
      id: "1",
      name: "Farm Show MT",
      location: "Parque de Exposições",
      date: "10 a 14 Março",
      numVisitantes: 50000,
      numExpositores: 200,
    },
    {
      id: "2",
      name: "Expo Primavera",
      location: "Centro de Eventos",
      date: "15 a 20 Março",
      numVisitantes: 30000,
      numExpositores: 150,
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: "",
    location: "",
    date: "",
    bannerUrl: "",
    logoUrl: "",
  });

  const handleCreateEvent = () => {
    if (!newEvent.name || !newEvent.location || !newEvent.date) {
      Alert.alert("Erro", "Preencha todos os campos obrigatórios");
      return;
    }

    const event: Event = {
      id: Math.random().toString(36).substr(2, 9),
      ...newEvent,
      numVisitantes: 0,
      numExpositores: 0,
    };

    setEvents([...events, event]);
    setNewEvent({ name: "", location: "", date: "", bannerUrl: "", logoUrl: "" });
    setShowCreateModal(false);
    Alert.alert("Sucesso", "Evento criado com sucesso!");
  };

  const handleDeleteEvent = (id: string) => {
    Alert.alert("Confirmar", "Tem certeza que deseja deletar este evento?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Deletar",
        style: "destructive",
        onPress: () => {
          setEvents(events.filter((e) => e.id !== id));
          Alert.alert("Sucesso", "Evento deletado com sucesso!");
        },
      },
    ]);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Erro", "Erro ao fazer logout");
    }
  };

  return (
    <ScreenContainer className="bg-gray-50">
      {/* Header */}
      <View className="bg-green-700 px-4 py-4 flex-row items-center justify-between">
        <View>
          <Text className="text-white text-lg font-bold">Admin Global</Text>
          <Text className="text-green-100 text-xs">{user?.email}</Text>
        </View>
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          className="bg-red-500 rounded-lg px-3 py-2"
        >
          <Text className="text-white font-semibold text-xs">Sair</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Stats */}
        <View className="px-4 py-6 gap-3">
          <View className="flex-row gap-3">
            <View className="flex-1 bg-white rounded-lg p-4 border border-gray-200">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-gray-600 text-xs font-semibold">Total de Eventos</Text>
                  <Text className="text-2xl font-bold text-green-700 mt-1">
                    {events.length}
                  </Text>
                </View>
                <MaterialIcons name="event" size={32} color="#16A34A" />
              </View>
            </View>

            <View className="flex-1 bg-white rounded-lg p-4 border border-gray-200">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-gray-600 text-xs font-semibold">Total Expositores</Text>
                  <Text className="text-2xl font-bold text-blue-700 mt-1">
                    {events.reduce((sum, e) => sum + e.numExpositores, 0)}
                  </Text>
                </View>
                <MaterialIcons name="store" size={32} color="#1D4ED8" />
              </View>
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 bg-white rounded-lg p-4 border border-gray-200">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-gray-600 text-xs font-semibold">Total Visitantes</Text>
                  <Text className="text-2xl font-bold text-orange-700 mt-1">
                    {(events.reduce((sum, e) => sum + e.numVisitantes, 0) / 1000).toFixed(0)}K
                  </Text>
                </View>
                <MaterialIcons name="people" size={32} color="#EA580C" />
              </View>
            </View>

            <View className="flex-1 bg-white rounded-lg p-4 border border-gray-200">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-gray-600 text-xs font-semibold">Taxa Ocupação</Text>
                  <Text className="text-2xl font-bold text-purple-700 mt-1">95%</Text>
                </View>
                <MaterialIcons name="trending-up" size={32} color="#7C3AED" />
              </View>
            </View>
          </View>
        </View>

        {/* Create Event Button */}
        <View className="px-4 mb-4">
          <Pressable
            onPress={() => setShowCreateModal(true)}
            style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
            className="bg-green-600 rounded-lg py-4 flex-row items-center justify-center gap-2"
          >
            <MaterialIcons name="add-circle" size={24} color="#ffffff" />
            <Text className="text-white font-bold text-lg">Novo Evento</Text>
          </Pressable>
        </View>

        {/* Events List */}
        <View className="px-4">
          <Text className="text-lg font-bold text-gray-800 mb-3">Eventos Gerenciados</Text>
          <FlatList
            scrollEnabled={false}
            data={events}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="bg-white rounded-lg p-4 mb-3 border border-gray-200">
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-800">{item.name}</Text>
                    <View className="flex-row items-center gap-2 mt-2">
                      <MaterialIcons name="location-on" size={16} color="#6B7280" />
                      <Text className="text-sm text-gray-600">{item.location}</Text>
                    </View>
                    <View className="flex-row items-center gap-2 mt-1">
                      <MaterialIcons name="calendar-today" size={16} color="#6B7280" />
                      <Text className="text-sm text-gray-600">{item.date}</Text>
                    </View>
                  </View>
                </View>

                {/* Stats */}
                <View className="flex-row gap-2 mb-3 py-2 border-t border-b border-gray-200">
                  <View className="flex-1">
                    <Text className="text-xs text-gray-600">Expositores</Text>
                    <Text className="text-lg font-bold text-blue-700">{item.numExpositores}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-gray-600">Visitantes</Text>
                    <Text className="text-lg font-bold text-orange-700">
                      {(item.numVisitantes / 1000).toFixed(0)}K
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-2">
                  <Pressable
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    className="flex-1 bg-blue-500 rounded-lg py-2 items-center"
                  >
                    <Text className="text-white font-semibold text-sm">Editar</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    className="flex-1 bg-green-600 rounded-lg py-2 items-center"
                  >
                    <Text className="text-white font-semibold text-sm">Gerenciar</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleDeleteEvent(item.id)}
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    className="flex-1 bg-red-500 rounded-lg py-2 items-center"
                  >
                    <Text className="text-white font-semibold text-sm">Deletar</Text>
                  </Pressable>
                </View>
              </View>
            )}
          />
        </View>
      </ScrollView>

      {/* Create Event Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <ScreenContainer className="bg-gray-50">
          <View className="bg-green-700 px-4 py-4 flex-row items-center justify-between">
            <Text className="text-white text-lg font-bold">Novo Evento</Text>
            <Pressable onPress={() => setShowCreateModal(false)}>
              <MaterialIcons name="close" size={24} color="#ffffff" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20 }}
          >
            {/* Event Name */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-800 mb-2">Nome do Evento *</Text>
              <TextInput
                placeholder="Ex: Farm Show MT"
                value={newEvent.name}
                onChangeText={(text) => setNewEvent({ ...newEvent, name: text })}
                className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
              />
            </View>

            {/* Location */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-800 mb-2">Localização *</Text>
              <TextInput
                placeholder="Ex: Parque de Exposições"
                value={newEvent.location}
                onChangeText={(text) => setNewEvent({ ...newEvent, location: text })}
                className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
              />
            </View>

            {/* Date */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-800 mb-2">Data *</Text>
              <TextInput
                placeholder="Ex: 10 a 14 Março"
                value={newEvent.date}
                onChangeText={(text) => setNewEvent({ ...newEvent, date: text })}
                className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
              />
            </View>

            {/* Banner Upload */}
            <ImageUploader
              label="Banner do Evento"
              placeholder="Selecione o banner"
              onImageUpload={(url) => setNewEvent({ ...newEvent, bannerUrl: url })}
              aspectRatio={16 / 9}
            />

            {/* Logo Upload */}
            <ImageUploader
              label="Logo do Evento"
              placeholder="Selecione o logo"
              onImageUpload={(url) => setNewEvent({ ...newEvent, logoUrl: url })}
              aspectRatio={1}
            />

            {/* Create Button */}
            <Pressable
              onPress={handleCreateEvent}
              style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
              className="bg-green-600 rounded-lg py-4 items-center justify-center mt-4"
            >
              <Text className="text-white font-bold text-lg">Criar Evento</Text>
            </Pressable>
          </ScrollView>
        </ScreenContainer>
      </Modal>
    </ScreenContainer>
  );
}
