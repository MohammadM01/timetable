import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Settings, Eye, Plus, RefreshCw } from 'lucide-react';
import TimetableGenerator from '@/components/TimetableGenerator';
import TimetableViewer from '@/components/TimetableViewer';

const TimetablePage = () => {
  const [activeTab, setActiveTab] = useState('generate');
  const [timetableStatus, setTimetableStatus] = useState(null);

  const fetchTimetableStatus = async () => {
    try {
      const response = await fetch('/api/timetable/status');
      const data = await response.json();
      setTimetableStatus(data);
    } catch (err) {
      console.error('Failed to fetch timetable status:', err);
    }
  };

  React.useEffect(() => {
    fetchTimetableStatus();
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      'not_generated': { variant: 'secondary', label: 'Not Generated' },
      'pending': { variant: 'outline', label: 'Pending' },
      'generating': { variant: 'default', label: 'Generating...' },
      'completed': { variant: 'default', label: 'Completed', className: 'bg-green-100 text-green-800' },
      'failed': { variant: 'destructive', label: 'Failed' }
    };
    
    const config = statusConfig[status] || statusConfig['not_generated'];
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Timetable Management</h1>
          <p className="text-gray-600">Generate and view school timetables</p>
        </div>
        <div className="flex items-center gap-4">
          {timetableStatus && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Status:</span>
              {getStatusBadge(timetableStatus.status)}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={fetchTimetableStatus}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Card */}
      {timetableStatus && timetableStatus.status !== 'not_generated' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timetable Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {timetableStatus.stats?.totalClasses || 0}
                </div>
                <div className="text-sm text-gray-600">Classes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {timetableStatus.stats?.totalTeachers || 0}
                </div>
                <div className="text-sm text-gray-600">Teachers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {timetableStatus.stats?.totalSubjects || 0}
                </div>
                <div className="text-sm text-gray-600">Subjects</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {timetableStatus.stats?.conflicts || 0}
                </div>
                <div className="text-sm text-gray-600">Conflicts</div>
              </div>
            </div>
            {timetableStatus.generatedAt && (
              <div className="mt-4 text-sm text-gray-600">
                Last generated: {new Date(timetableStatus.generatedAt).toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Generate Timetable
          </TabsTrigger>
          <TabsTrigger value="view" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            View Timetable
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <TimetableGenerator onGenerate={fetchTimetableStatus} />
        </TabsContent>

        <TabsContent value="view" className="space-y-6">
          <TimetableViewer />
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Plus className="h-6 w-6 mb-2" />
              <span>Add Teacher</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Plus className="h-6 w-6 mb-2" />
              <span>Add Subject</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Plus className="h-6 w-6 mb-2" />
              <span>Add Class</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimetablePage;















