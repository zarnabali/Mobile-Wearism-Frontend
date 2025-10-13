import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ImageBackground,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const QueueMonitoringScreen = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedQueue, setSelectedQueue] = useState('audit');

  // Mock queue data based on API responses
  const queues = [
    {
      name: 'audit',
      displayName: 'Audit Queue',
      status: 'active',
      waiting: 5,
      active: 2,
      completed: 150,
      failed: 3,
      delayed: 1,
      health: 'healthy'
    },
    {
      name: 'maintenance',
      displayName: 'Maintenance Queue',
      status: 'active',
      waiting: 12,
      active: 1,
      completed: 89,
      failed: 1,
      delayed: 0,
      health: 'healthy'
    },
    {
      name: 'email',
      displayName: 'Email Queue',
      status: 'paused',
      waiting: 25,
      active: 0,
      completed: 234,
      failed: 8,
      delayed: 2,
      health: 'warning'
    }
  ];

  const mockJobs = [
    {
      id: '68d8ff661b79091dc833e3f1',
      name: 'audit-cleanup',
      status: 'completed',
      progress: 100,
      data: {
        schemaName: 'product',
        olderThan: 365,
        operation: 'cleanup'
      },
      timestamp: '2025-09-28T09:27:02.049Z',
      processedOn: '2025-09-28T09:27:05.123Z',
      finishedOn: '2025-09-28T09:27:15.456Z',
      attemptsMade: 1,
      failedReason: null,
      priority: 'normal'
    },
    {
      id: '68d8ff661b79091dc833e3f2',
      name: 'generate-stats',
      status: 'active',
      progress: 65,
      data: {
        schemaName: 'customer',
        timeframe: '30d'
      },
      timestamp: '2025-09-28T10:15:30.123Z',
      processedOn: '2025-09-28T10:15:33.456Z',
      finishedOn: null,
      attemptsMade: 1,
      failedReason: null,
      priority: 'high'
    },
    {
      id: '68d8ff661b79091dc833e3f3',
      name: 'database-maintenance',
      status: 'failed',
      progress: 25,
      data: {
        operations: ['indexes', 'cleanup']
      },
      timestamp: '2025-09-28T08:15:30.123Z',
      processedOn: '2025-09-28T08:15:35.789Z',
      finishedOn: '2025-09-28T08:15:45.012Z',
      attemptsMade: 3,
      failedReason: 'Database connection timeout',
      priority: 'low'
    },
    {
      id: '68d8ff661b79091dc833e3f4',
      name: 'health-check',
      status: 'waiting',
      progress: 0,
      data: {
        includeDatabase: true,
        includeQueues: true
      },
      timestamp: '2025-09-28T11:00:00.000Z',
      processedOn: null,
      finishedOn: null,
      attemptsMade: 0,
      failedReason: null,
      priority: 'normal'
    },
    {
      id: '68d8ff661b79091dc833e3f5',
      name: 'email-notification',
      status: 'delayed',
      progress: 0,
      data: {
        to: 'admin@testcompany.com',
        subject: 'System Report',
        delay: 3600000 // 1 hour
      },
      timestamp: '2025-09-28T10:30:00.000Z',
      processedOn: null,
      finishedOn: null,
      attemptsMade: 0,
      failedReason: null,
      priority: 'low'
    }
  ];

  const filteredJobs = mockJobs.filter(job => {
    if (selectedQueue === 'all') return true;
    return job.name.includes(selectedQueue) || selectedQueue === 'audit';
  });

  const handlePauseQueue = (queueName: string) => {
    Alert.alert(
      'Pause Queue',
      `Are you sure you want to pause the ${queueName} queue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pause', onPress: () => console.log('Pause queue:', queueName) }
      ]
    );
  };

  const handleResumeQueue = (queueName: string) => {
    Alert.alert(
      'Resume Queue',
      `Are you sure you want to resume the ${queueName} queue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Resume', onPress: () => console.log('Resume queue:', queueName) }
      ]
    );
  };

  const handleRetryJob = (jobId: string) => {
    Alert.alert(
      'Retry Job',
      'Are you sure you want to retry this job?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retry', onPress: () => console.log('Retry job:', jobId) }
      ]
    );
  };

  const handleRemoveJob = (jobId: string) => {
    Alert.alert(
      'Remove Job',
      'Are you sure you want to remove this job?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => console.log('Remove job:', jobId) }
      ]
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', { 
      month: 'short', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#059669';
      case 'active': return '#EA580C';
      case 'failed': return '#DC2626';
      case 'waiting': return '#6B7280';
      case 'delayed': return '#7C3AED';
      default: return '#9CA3AF';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'checkmark-circle-outline';
      case 'active': return 'play-circle-outline';
      case 'failed': return 'close-circle-outline';
      case 'waiting': return 'time-outline';
      case 'delayed': return 'pause-circle-outline';
      default: return 'ellipse-outline';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return '#059669';
      case 'warning': return '#EA580C';
      case 'critical': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const QueueCard = ({ queue, index }: { queue: any; index: number }) => {
    const gradients = [
      ['#4F46E5', '#7C3AED'],
      ['#7C3AED', '#EC4899'],
      ['#059669', '#0891B2'],
      ['#DC2626', '#EA580C']
    ];
    const gradient = gradients[index % gradients.length];
    const healthColor = getHealthColor(queue.health);

    return (
      <TouchableOpacity
        onPress={() => setSelectedQueue(queue.name)}
        className="mb-4"
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={gradient as any}
          style={{ borderRadius: 16, padding: 16 }}
        >
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1">
              <Text className="text-white text-lg font-semibold mb-1">
                {queue.displayName}
              </Text>
              <Text className="text-white/70 text-sm mb-2">
                {queue.name} queue
              </Text>
              <View className="flex-row items-center">
                <View 
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: healthColor }}
                />
                <Text className="text-white/60 text-xs capitalize">
                  {queue.health} • {queue.status}
                </Text>
              </View>
            </View>
            <View className="flex-row space-x-2">
              {queue.status === 'active' ? (
                <TouchableOpacity 
                  onPress={() => handlePauseQueue(queue.name)}
                  className="w-8 h-8 rounded-full bg-white/20 items-center justify-center"
                >
                  <Ionicons name="pause" size={14} color="#fff" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  onPress={() => handleResumeQueue(queue.name)}
                  className="w-8 h-8 rounded-full bg-white/20 items-center justify-center"
                >
                  <Ionicons name="play" size={14} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View className="grid grid-cols-4 gap-3">
            <View className="bg-white/10 rounded-lg p-2">
              <Text className="text-white text-lg font-bold">{queue.waiting}</Text>
              <Text className="text-white/70 text-xs">Waiting</Text>
            </View>
            <View className="bg-white/10 rounded-lg p-2">
              <Text className="text-white text-lg font-bold">{queue.active}</Text>
              <Text className="text-white/70 text-xs">Active</Text>
            </View>
            <View className="bg-white/10 rounded-lg p-2">
              <Text className="text-white text-lg font-bold">{queue.completed}</Text>
              <Text className="text-white/70 text-xs">Completed</Text>
            </View>
            <View className="bg-white/10 rounded-lg p-2">
              <Text className="text-white text-lg font-bold">{queue.failed}</Text>
              <Text className="text-white/70 text-xs">Failed</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const JobCard = ({ job, index }: { job: any; index: number }) => {
    const statusColor = getStatusColor(job.status);
    const statusIcon = getStatusIcon(job.status);

    return (
      <View className="bg-gray-800/50 rounded-xl p-4 mb-4 border border-gray-700/50">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              <View 
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: statusColor + '20' }}
              >
                <Ionicons name={statusIcon as any} size={16} color={statusColor} />
              </View>
              <View>
                <Text className="text-white font-semibold">{job.name}</Text>
                <Text className="text-gray-400 text-sm capitalize">{job.status}</Text>
              </View>
            </View>
            
            <View className="bg-gray-700/30 rounded-lg p-2 mb-2">
              <Text className="text-gray-300 text-xs">
                <Text className="font-medium">Data: </Text>
                {JSON.stringify(job.data).substring(0, 80)}...
              </Text>
            </View>

            {job.status === 'active' && (
              <View className="mb-2">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-gray-400 text-xs">Progress</Text>
                  <Text className="text-gray-400 text-xs">{job.progress}%</Text>
                </View>
                <View className="h-1 bg-gray-700 rounded-full">
                  <View 
                    className="h-1 rounded-full"
                    style={{ 
                      width: `${job.progress}%`,
                      backgroundColor: statusColor
                    }}
                  />
                </View>
              </View>
            )}

            {job.failedReason && (
              <View className="bg-red-500/10 rounded-lg p-2 mb-2">
                <Text className="text-red-400 text-xs font-medium">Error</Text>
                <Text className="text-red-300 text-xs">{job.failedReason}</Text>
              </View>
            )}
          </View>
        </View>

        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text className="text-gray-400 text-xs ml-1">
              {formatDate(job.timestamp)}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="repeat-outline" size={14} color="#6B7280" />
            <Text className="text-gray-400 text-xs ml-1">
              {job.attemptsMade} attempts
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center">
            <Ionicons name="play-outline" size={14} color="#6B7280" />
            <Text className="text-gray-400 text-xs ml-1">
              Started: {formatDate(job.processedOn)}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="flag-outline" size={14} color="#6B7280" />
            <Text className="text-gray-400 text-xs ml-1 capitalize">
              {job.priority} priority
            </Text>
          </View>
        </View>

        <View className="flex-row space-x-2">
          {(job.status === 'failed' || job.status === 'waiting') && (
            <TouchableOpacity 
              onPress={() => handleRetryJob(job.id)}
              className="flex-1 bg-blue-500/20 py-2 px-4 rounded-lg"
            >
              <Text className="text-blue-400 text-center text-sm font-medium">Retry</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            onPress={() => handleRemoveJob(job.id)}
            className="flex-1 bg-red-500/20 py-2 px-4 rounded-lg"
          >
            <Text className="text-red-400 text-center text-sm font-medium">Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const TabButton = ({ title, index, onPress }: { title: string; index: number; onPress: (index: number) => void }) => (
    <TouchableOpacity
      onPress={() => onPress(index)}
      className={`px-4 py-2 rounded-full mr-2 ${activeTab === index ? 'bg-blue-600' : 'bg-gray-800'}`}
    >
      <Text className={`font-medium ${activeTab === index ? 'text-white' : 'text-gray-400'}`}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const StatsCard = ({ title, value, color, icon }: { 
    title: string; value: number; color: string; icon: string 
  }) => (
    <View className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
      <View className="flex-row items-center justify-between mb-2">
        <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: color + '20' }}>
          <Ionicons name={icon as any} size={16} color={color} />
        </View>
        <Text className="text-white text-2xl font-bold">{value}</Text>
      </View>
      <Text className="text-gray-400 text-sm">{title}</Text>
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
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <Text className="text-white text-lg font-semibold">Queue Monitoring</Text>
          
          <TouchableOpacity className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center">
            <Ionicons name="refresh-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView 
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Tab Navigation */}
          <View className="flex-row mb-6">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TabButton title="Queues" index={0} onPress={setActiveTab} />
              <TabButton title="Jobs" index={1} onPress={setActiveTab} />
              <TabButton title="Failed Jobs" index={2} onPress={setActiveTab} />
              <TabButton title="Health" index={3} onPress={setActiveTab} />
            </ScrollView>
          </View>

          {activeTab === 0 && (
            <View>
              {/* Queue Stats */}
              <View className="flex-row justify-between mb-6 space-x-3">
                <StatsCard
                  title="Total Queues"
                  value={queues.length}
                  color="#4F46E5"
                  icon="list-outline"
                />
                <StatsCard
                  title="Active Queues"
                  value={queues.filter(q => q.status === 'active').length}
                  color="#059669"
                  icon="play-circle-outline"
                />
                <StatsCard
                  title="Paused Queues"
                  value={queues.filter(q => q.status === 'paused').length}
                  color="#EA580C"
                  icon="pause-circle-outline"
                />
              </View>

              {/* Queue List */}
              <View className="mb-6">
                <Text className="text-white text-lg font-semibold mb-4">Queue Status</Text>
                {queues.map((queue, index) => (
                  <QueueCard key={queue.name} queue={queue} index={index} />
                ))}
              </View>
            </View>
          )}

          {activeTab === 1 && (
            <View>
              {/* Job Stats */}
              <View className="flex-row justify-between mb-6 space-x-3">
                <StatsCard
                  title="Total Jobs"
                  value={mockJobs.length}
                  color="#4F46E5"
                  icon="list-outline"
                />
                <StatsCard
                  title="Active Jobs"
                  value={mockJobs.filter(j => j.status === 'active').length}
                  color="#EA580C"
                  icon="play-circle-outline"
                />
                <StatsCard
                  title="Completed"
                  value={mockJobs.filter(j => j.status === 'completed').length}
                  color="#059669"
                  icon="checkmark-circle-outline"
                />
                <StatsCard
                  title="Failed"
                  value={mockJobs.filter(j => j.status === 'failed').length}
                  color="#DC2626"
                  icon="close-circle-outline"
                />
              </View>

              {/* Job List */}
              <View className="mb-6">
                <Text className="text-white text-lg font-semibold mb-4">Recent Jobs</Text>
                {filteredJobs.map((job, index) => (
                  <JobCard key={job.id} job={job} index={index} />
                ))}
              </View>
            </View>
          )}

          {activeTab === 2 && (
            <View>
              <Text className="text-white text-lg font-semibold mb-4">Failed Jobs</Text>
              {mockJobs.filter(j => j.status === 'failed').map((job, index) => (
                <JobCard key={job.id} job={job} index={index} />
              ))}
            </View>
          )}

          {activeTab === 3 && (
            <View>
              <Text className="text-white text-lg font-semibold mb-4">System Health</Text>
              <View className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <View className="flex-row items-center mb-4">
                  <View className="w-4 h-4 rounded-full bg-green-500 mr-3" />
                  <Text className="text-white font-semibold">Overall Status: Healthy</Text>
                </View>
                
                <View className="space-y-3">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-400">Database Connection</Text>
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                      <Text className="text-green-400 text-sm">Connected</Text>
                    </View>
                  </View>
                  
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-400">Redis Connection</Text>
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                      <Text className="text-green-400 text-sm">Connected</Text>
                    </View>
                  </View>
                  
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-400">Queue Workers</Text>
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                      <Text className="text-green-400 text-sm">Running</Text>
                    </View>
                  </View>
                  
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-400">Memory Usage</Text>
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 rounded-full bg-yellow-500 mr-2" />
                      <Text className="text-yellow-400 text-sm">75%</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

export default QueueMonitoringScreen;

