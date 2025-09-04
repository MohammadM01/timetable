import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Calendar, Users, BookOpen, Settings } from 'lucide-react';

const TimetableGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [generationType, setGenerationType] = useState('all');
  const [viewType, setViewType] = useState('student');
  const [config, setConfig] = useState({
    daysPerWeek: 5,
    periodsPerDay: 8,
    periodDuration: 45,
    startTime: '08:00'
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch available classes
  useEffect(() => {
    fetchAvailableClasses();
  }, []);

  const fetchAvailableClasses = async () => {
    try {
      const response = await fetch('/api/timetable/available-classes');
      const data = await response.json();
      setClasses(data);
    } catch (err) {
      setError('Failed to fetch available classes');
    }
  };

  const handleClassSelection = (classId, checked) => {
    if (checked) {
      setSelectedClasses([...selectedClasses, classId]);
    } else {
      setSelectedClasses(selectedClasses.filter(id => id !== classId));
    }
  };

  const handleSelectAll = () => {
    if (selectedClasses.length === classes.length) {
      setSelectedClasses([]);
    } else {
      setSelectedClasses(classes.map(c => c.id));
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const payload = {
        config,
        selectedClasses,
        generationType,
        viewType
      };

      const response = await fetch('/api/timetable/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.message}`);
        // Reset selections
        setSelectedClasses([]);
        setGenerationType('all');
      } else {
        setError(data.error || 'Failed to generate timetable');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const groupedClasses = classes.reduce((acc, cls) => {
    if (!acc[cls.standard]) {
      acc[cls.standard] = [];
    }
    acc[cls.standard].push(cls);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timetable Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Generation Type Selection */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Generation Type</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card 
                className={`cursor-pointer transition-colors ${
                  generationType === 'all' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => setGenerationType('all')}
              >
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-semibold">All Classes</h3>
                  <p className="text-sm text-gray-600">Generate for all classes</p>
                </CardContent>
              </Card>
              
              <Card 
                className={`cursor-pointer transition-colors ${
                  generationType === 'selected' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => setGenerationType('selected')}
              >
                <CardContent className="p-4 text-center">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <h3 className="font-semibold">Selected Classes</h3>
                  <p className="text-sm text-gray-600">Choose specific classes</p>
                </CardContent>
              </Card>
              
              <Card 
                className={`cursor-pointer transition-colors ${
                  generationType === 'standard' ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => setGenerationType('standard')}
              >
                <CardContent className="p-4 text-center">
                  <Settings className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <h3 className="font-semibold">By Standard</h3>
                  <p className="text-sm text-gray-600">Generate by grade level</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Class Selection */}
          {generationType === 'selected' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Select Classes</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSelectAll}
                >
                  {selectedClasses.length === classes.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              
              <div className="max-h-60 overflow-y-auto border rounded-lg p-4">
                {Object.entries(groupedClasses).map(([standard, standardClasses]) => (
                  <div key={standard} className="mb-4">
                    <h4 className="font-semibold text-gray-700 mb-2">{standard}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {standardClasses.map((cls) => (
                        <div key={cls.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={cls.id}
                            checked={selectedClasses.includes(cls.id)}
                            onCheckedChange={(checked) => handleClassSelection(cls.id, checked)}
                          />
                          <Label htmlFor={cls.id} className="text-sm">
                            {cls.division}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedClasses.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {selectedClasses.length} class(es) selected
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* View Type Selection */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">View Type</Label>
            <Select value={viewType} onValueChange={setViewType}>
              <SelectTrigger>
                <SelectValue placeholder="Select view type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student View (Class-wise)</SelectItem>
                <SelectItem value="teacher">Teacher View (Teacher-wise)</SelectItem>
                <SelectItem value="school">School View (Complete Overview)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Configuration */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">School Configuration</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="daysPerWeek">Days per Week</Label>
                <Input
                  id="daysPerWeek"
                  type="number"
                  min="1"
                  max="7"
                  value={config.daysPerWeek}
                  onChange={(e) => setConfig({...config, daysPerWeek: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="periodsPerDay">Periods per Day</Label>
                <Input
                  id="periodsPerDay"
                  type="number"
                  min="1"
                  max="12"
                  value={config.periodsPerDay}
                  onChange={(e) => setConfig({...config, periodsPerDay: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="periodDuration">Period Duration (min)</Label>
                <Input
                  id="periodDuration"
                  type="number"
                  min="30"
                  max="90"
                  value={config.periodDuration}
                  onChange={(e) => setConfig({...config, periodDuration: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={config.startTime}
                  onChange={(e) => setConfig({...config, startTime: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Messages */}
          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate} 
            disabled={loading || (generationType === 'selected' && selectedClasses.length === 0)}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Timetable...
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                Generate Timetable
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimetableGenerator;
