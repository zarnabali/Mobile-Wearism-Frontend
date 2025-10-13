import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ImageBackground,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface QueueStatus {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

interface Job {
  id: string;
  name: string;
  data: any;
  status: string;
  progress: number;
  attemptsMade: number;
  failedReason?: string;
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
  delay: number;
  priority: number;
}

const QueuesScreen = () => {
  const [queues, setQueues] = useState<QueueStatus[]>([]);
  const [selectedQueue, setSelectedQueue] = useState<string>('audit');
  const [jobs, setJobs] = useState<{
    waiting: Job[];
    active: Job[];
    completed: Job[];
    failed: Job[];
    delayed: Job[];
  }>({
    waiting: [],
    active: [],
    completed: [],
    failed: [],
    delayed: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadQueueData();
  }, []);

  useEffect(() => {
    if (selectedQueue) {
      loadQueueJobs();
    }
  }, [selectedQueue]);

  const loadQueueData = async () => {
    try {
      setLoading(true);
      const token = await getStoredToken();
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await fetch('http://localhost:3000/api/queues/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setQueues(data.data || []);
      }
    } catch (error) {
      console.error('Error loading queue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadQueueJobs = async () => {
    try {
      const token = await getStoredToken();
      if (!token) return;

      const response = await fetch(`http://localhost:3000/api/queues/${selectedQueue}/jobs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setJobs(data.data || {
          waiting: [],
          active: [],
          completed: [],
          failed: [],
          delayed: [],
        });
      }
    } catch (error) {
      console.error('Error loading queue jobs:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQueueData();
    if (selectedQueue) {
      await loadQueueJobs();
    }
    setRefreshing(false);
  };

  const getStoredToken = async () => {
    // Implement token storage retrieval
    return null;
  };

  const handlePauseQueue = async (queueName: string) => {
    try {
      const token = await getStoredToken();
      if (!token) return;

      await fetch(`http://localhost:3000/api/queues/${queueName}/pause`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      await loadQueueData();
    } catch (error) {
      console.error('Error pausing queue:', error);
    }
  };

  const handleResumeQueue = async (queueName: string) => {
    try {
      const token = await getStoredToken();
      if (!token) return;

      await fetch(`http://localhost:3000/api/queues/${queueName}/resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      await loadQueueData();
    } catch (error) {
      console.error('Error resuming queue:', error);
    }
  };

  const handleRetryFailedJobs = async (queueName: string) => {
    try {
      const token = await getStoredToken();
      if (!token) return;

      await fetch(`http://localhost:3000/api/queues/${queueName}/retry-failed`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      await loadQueueJobs();
    } catch (error) {
      console.error('Error retrying failed jobs:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return '#3B82F6';
      case 'active': return '#F59E0B';
      case 'completed': return '#059669';
      case 'failed': return '#DC2626';
      case 'delayed': return '#7C3AED';
      default: return '#6B7280';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const QueueCard = ({ queue }: { queue: QueueStatus }) => (
    <View className="bg-gray-900/50 rounded-2xl p-4 mb-3 border border-gray-700/50">
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-blue-500/20 items-center justify-center mr-3">
            <Ionicons name="list" size={20} color="#60A5FA" />
          </View>
          <View>
            <Text className="text-white font-semibold text-lg">{queue.name}</Text>
            <View className={`px-2 py-1 rounded-full ${
              queue.paused ? 'bg-red-500/20' : 'bg-green-500/20'
            }`}>
              <Text className={`text-xs font-medium ${
                queue.paused ? 'text-red-200' : 'text-green-200'
              }`}>
                {queue.paused ? 'PAUSED' : 'ACTIVE'}
              </Text>
            </View>
          </View>
        </View>
        <View className="flex-row space-x-2">
          {queue.paused ? (
            <TouchableOpacity
              onPress={() => handleResumeQueue(queue.name)}
              className="w-8 h-8 rounded-full bg-green-600 items-center justify-center"
            >
              <Ionicons name="play" size={16} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => handlePauseQueue(queue.name)}
              className="w-8 h-8 rounded-full bg-yellow-600 items-center justify-center"
            >
              <Ionicons name="pause" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View className="flex-row justify-between mb-3">
        <View className="flex-1 mr-2">
          <Text className="text-gray-400 text-sm">Waiting</Text>
          <Text className="text-white text-xl font-bold">{queue.waiting}</Text>
        </View>
        <View className="flex-1 mr-2">
          <Text className="text-gray-400 text-sm">Active</Text>
          <Text className="text-white text-xl font-bold">{queue.active}</Text>
        </View>
        <View className="flex-1 mr-2">
          <Text className="text-gray-400 text-sm">Completed</Text>
          <Text className="text-white text-xl font-bold">{queue.completed}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-gray-400 text-sm">Failed</Text>
          <Text className="text-white text-xl font-bold">{queue.failed}</Text>
        </View>
      </View>

      {queue.failed > 0 && (
        <TouchableOpacity
          onPress={() => handleRetryFailedJobs(queue.name)}
          className="bg-red-600/20 rounded-xl p-3 border border-red-600/30"
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="refresh" size={16} color="#EF4444" />
            <Text className="text-red-400 text-sm font-medium ml-2">
              Retry {queue.failed} Failed Jobs
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );

  const JobCard = ({ job, status }: { job: Job; status: string }) => (
    <View className="bg-gray-800/50 rounded-xl p-3 mb-2 border border-gray-700/30">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-white font-medium text-sm">{job.name}</Text>
          <Text className="text-gray-400 text-xs">ID: {job.id}</Text>
        </View>
        <View className={`px-2 py-1 rounded-full`} style={{ backgroundColor: getStatusColor(status) + '20' }}>
          <Text className="text-xs font-medium" style={{ color: getStatusColor(status) }}>
            {status.toUpperCase()}
          </Text>
        </View>
      </View>

      {job.progress > 0 && (
        <View className="mb-2">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-gray-400 text-xs">Progress</Text>
            <Text className="text-white text-xs">{job.progress}%</Text>
          </View>
          <View className="w-full bg-gray-700 rounded-full h-1">
            <View 
              className="bg-blue-500 h-1 rounded-full"
              style={{ width: `${job.progress}%` }}
            />
          </View>
        </View>
      )}

      <View className="flex-row justify-between items-center">
        <Text className="text-gray-500 text-xs">
          {formatTimestamp(job.timestamp)}
        </Text>
        {job.attemptsMade > 0 && (
          <Text className="text-gray-500 text-xs">
            Attempts: {job.attemptsMade}
          </Text>
        )}
      </View>

      {job.failedReason && (
        <View className="mt-2 p-2 bg-red-900/20 rounded border border-red-700/30">
          <Text className="text-red-400 text-xs">{job.failedReason}</Text>
        </View>
      )}
    </View>
  );

  return (
    <ImageBackground
      source={require('../assets/background/img5.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 pt-14 pb-6">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          
          <Text className="text-white text-lg font-semibold">Queue Management</Text>
          
          <TouchableOpacity className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center">
            <Ionicons name="settings-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
            />
          }
        >
          {/* Queue Overview */}
          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-4">Queue Status</Text>
            {loading ? (
              <View className="flex-1 items-center justify-center py-20">
                <Text className="text-white text-lg">Loading queues...</Text>
              </View>
            ) : queues.length === 0 ? (
              <View className="flex-1 items-center justify-center py-20">
                <Ionicons name="list-outline" size={64} color="#6B7280" />
                <Text className="text-white text-lg font-semibold mt-4">No Queues Found</Text>
                <Text className="text-gray-400 text-sm text-center mt-2">
                  No queues are currently active
                </Text>
              </View>
            ) : (
              <View>
                {queues.map((queue) => (
                  <QueueCard key={queue.name} queue={queue} />
                ))}
              </View>
            )}
          </View>

          {/* Queue Jobs */}
          {selectedQueue && (
            <View className="mb-6">
              <Text className="text-white text-lg font-semibold mb-4">
                Jobs - {selectedQueue}
              </Text>
              
              {/* Job Status Tabs */}
              <View className="flex-row mb-4">
                <TouchableOpacity
                  className={`px-4 py-2 rounded-l-xl ${
                    selectedQueue === 'waiting' ? 'bg-blue-600' : 'bg-gray-800'
                  }`}
                >
                  <Text className={`text-sm font-medium ${
                    selectedQueue === 'waiting' ? 'text-white' : 'text-gray-400'
                  }`}>
                    Waiting ({jobs.waiting.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`px-4 py-2 ${
                    selectedQueue === 'active' ? 'bg-blue-600' : 'bg-gray-800'
                  }`}
                >
                  <Text className={`text-sm font-medium ${
                    selectedQueue === 'active' ? 'text-white' : 'text-gray-400'
                  }`}>
                    Active ({jobs.active.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`px-4 py-2 ${
                    selectedQueue === 'completed' ? 'bg-blue-600' : 'bg-gray-800'
                  }`}
                >
                  <Text className={`text-sm font-medium ${
                    selectedQueue === 'completed' ? 'text-white' : 'text-gray-400'
                  }`}>
                    Completed ({jobs.completed.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`px-4 py-2 rounded-r-xl ${
                    selectedQueue === 'failed' ? 'bg-blue-600' : 'bg-gray-800'
                  }`}
                >
                  <Text className={`text-sm font-medium ${
                    selectedQueue === 'failed' ? 'text-white' : 'text-gray-400'
                  }`}>
                    Failed ({jobs.failed.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Jobs List */}
              <View>
                {jobs.waiting.map((job) => (
                  <JobCard key={job.id} job={job} status="waiting" />
                ))}
                {jobs.active.map((job) => (
                  <JobCard key={job.id} job={job} status="active" />
                ))}
                {jobs.completed.map((job) => (
                  <JobCard key={job.id} job={job} status="completed" />
                ))}
                {jobs.failed.map((job) => (
                  <JobCard key={job.id} job={job} status="failed" />
                ))}
                {jobs.delayed.map((job) => (
                  <JobCard key={job.id} job={job} status="delayed" />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

export default QueuesScreen;
