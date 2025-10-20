"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// DCCI Weight Estimation Constants
// Note: Finished compost is only reported in gallons, not converted to weight
const BUCKET_WEIGHT = 1.8; // Bucket weight in pounds (from DCCI instructions)
const BROWNS_GALLONS_TO_POUNDS = 1.2; // 1 gallon browns = 1.2 pounds (from DCCI instructions)

interface DailyData {
  date: string;
  submissions: number;
  added: number; // pounds added
  removed: number; // gallons removed (finished compost volume only)
  hasActivity: boolean;
}

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  data?: DailyData;
}

interface DayDetails {
  date: string;
  submissions: Array<{
    id: number;
    submissionId: number;
    time: string;
    user: string;
    site: string;
    tasks: string[];
  }>;
  totalAdded: number;
  totalRemoved: number;
}

export function DailyCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayDetails | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchDailyData();
  }, [currentDate]);

  const fetchDailyData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      // Fetch form submissions for the month with related data
      const { data: submissions, error: submissionsError } = await supabase
        .from('Form Submission')
        .select(`
          submission_id,
          timestamp,
          first_name,
          last_name,
          site_id,
          Site(site_name),
          Measurements(bin_type),
          "Adding Material"(greens_pounds, browns_gallons),
          "Moving Day"(moving_id),
          "Finished Compost"(gallons_compost_taken),
          "Browns Bin"(browns_id),
          Issues(issue_id),
          Litter(litter_id)
        `)
        .gte('timestamp', startOfMonth.toISOString())
        .lte('timestamp', endOfMonth.toISOString())
        .order('timestamp', { ascending: false });

      if (submissionsError) {
        console.error('Error fetching submissions:', submissionsError);
        throw submissionsError;
      }

      // Process and group data by date
      const processedData = processDailyData(submissions || []);
      setDailyData(processedData);
      
    } catch (err) {
      console.error('Error fetching daily data:', err);
    } finally {
      setLoading(false);
    }
  };

  const processDailyData = (submissions: any[]): DailyData[] => {
    const dailyMap = new Map<string, DailyData>();
    
    submissions.forEach(submission => {
      const date = new Date(submission.timestamp).toISOString().split('T')[0];
      
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          submissions: 0,
          added: 0,
          removed: 0,
          hasActivity: false
        });
      }
      
      const dayData = dailyMap.get(date)!;
      dayData.submissions++;
      dayData.hasActivity = true;
      
      // Calculate added weight using DCCI's accurate methods
      
      // Greens from Adding Material (with bucket adjustment)
      if (submission["Adding Material"] && submission["Adding Material"].length > 0) {
        submission["Adding Material"].forEach((material: any) => {
          if (material.greens_pounds && material.greens_pounds > 0) {
            // DCCI method: Subtract bucket weight (1.8 lbs per drop-off)
            const greensWithBucketAdjustment = Math.max(0, material.greens_pounds - BUCKET_WEIGHT);
            dayData.added += greensWithBucketAdjustment;
          }
        });
      }
      
      // Browns from Browns Bin (with DCCI conversion and bucket adjustment)
      if (submission["Browns Bin"] && submission["Browns Bin"].length > 0) {
        submission["Browns Bin"].forEach((browns: any) => {
          const brownsGallons = (browns.bin_a_browns_gallons || 0) + (browns.bin_b_browns_gallons || 0);
          if (brownsGallons > 0) {
            // DCCI method: (gallons × 1.2) - bucket weight
            const brownsWeight = Math.max(0, (brownsGallons * BROWNS_GALLONS_TO_POUNDS) - BUCKET_WEIGHT);
            dayData.added += brownsWeight;
          }
        });
      }
      
      // Calculate removed volume (finished compost in gallons only)
      if (submission["Finished Compost"] && submission["Finished Compost"].length > 0) {
        submission["Finished Compost"].forEach((compost: any) => {
          if (compost.gallons_compost_taken && compost.gallons_compost_taken > 0) {
            // Store finished compost volume in gallons (no weight conversion)
            dayData.removed += compost.gallons_compost_taken;
          }
        });
      }
    });
    
    return Array.from(dailyMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayData = dailyData.find(d => d.date === date.toISOString().split('T')[0]);
      
      days.push({
        date,
        dayNumber: date.getDate(),
        isCurrentMonth: date.getMonth() === month,
        data: dayData
      });
    }
    
    return days;
  };

  const showDayDetails = async (dayData: DailyData) => {
    try {
      const supabase = createClient();
      
      // Fetch detailed submissions for the selected day
      const { data: submissions, error } = await supabase
        .from('Form Submission')
        .select(`
          submission_id,
          timestamp,
          first_name,
          last_name,
          site_id,
          Site(site_name),
          Measurements(bin_type),
          "Adding Material"(greens_pounds),
          "Moving Day"(moving_id),
          "Finished Compost"(gallons_compost_taken),
          "Browns Bin"(browns_id),
          Issues(issue_id),
          Litter(litter_id)
        `)
        .gte('timestamp', `${dayData.date}T00:00:00`)
        .lte('timestamp', `${dayData.date}T23:59:59`)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const dayDetails: DayDetails = {
        date: dayData.date,
        submissions: [],
        totalAdded: dayData.added,
        totalRemoved: dayData.removed
      };

      submissions?.forEach(submission => {
        const tasks: string[] = [];
        if (submission.Measurements && submission.Measurements.length > 0) tasks.push('Measurements');
        if (submission["Adding Material"] && submission["Adding Material"].length > 0) tasks.push('Adding Material');
        if (submission["Moving Day"] && submission["Moving Day"].length > 0) tasks.push('Moving Bins');
        if (submission["Finished Compost"] && submission["Finished Compost"].length > 0) tasks.push('Finished Compost');
        if (submission["Browns Bin"] && submission["Browns Bin"].length > 0) tasks.push('Browns Bin');
        if (submission.Issues && submission.Issues.length > 0) tasks.push('Issues');
        if (submission.Litter && submission.Litter.length > 0) tasks.push('Litter');

        dayDetails.submissions.push({
          id: submission.submission_id,
          submissionId: submission.submission_id,
          time: new Date(submission.timestamp).toLocaleTimeString(),
          user: `${submission.first_name} ${submission.last_name}`,
          site: (submission.Site as any)?.site_name || `Site ${submission.site_id}`,
          tasks
        });
      });

      setSelectedDay(dayDetails);
      setShowModal(true);
    } catch (err) {
      console.error('Error fetching day details:', err);
    }
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const calendarDays = generateCalendarDays();

  return (
    <>
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Daily Activity Calendar</h3>
            <div className="flex items-center space-x-4">
              <button
                onClick={previousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Previous month"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-lg font-medium text-gray-900 min-w-[140px] text-center">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Next month"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="text-center text-gray-500 py-8">
              Loading calendar data...
            </div>
          ) : (
            <>
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
                
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`
                      aspect-square flex flex-col items-center justify-center text-sm cursor-pointer rounded-lg border
                      ${!day.isCurrentMonth ? 'text-gray-300 bg-gray-50' : 'text-gray-900 hover:bg-gray-50'}
                      ${day.data?.hasActivity ? 'bg-blue-50 border-blue-200 text-blue-700 font-semibold hover:bg-blue-100' : 'border-gray-200'}
                      ${day.date.toDateString() === new Date().toDateString() ? 'ring-2 ring-blue-500' : ''}
                    `}
                    onClick={() => day.data && showDayDetails(day.data)}
                    title={day.data?.hasActivity ? `Click to view details for ${day.date.toLocaleDateString()}` : ''}
                  >
                    <span className="text-base">{day.dayNumber}</span>
                    {day.data?.hasActivity && (
                      <div className="text-xs text-center leading-tight">
                        <div className="font-medium">{day.data.submissions} form{day.data.submissions !== 1 ? 's' : ''}</div>
                        {day.data.added > 0 && <div className="text-green-600">+{day.data.added.toFixed(1)}lbs</div>}
                        {day.data.removed > 0 && <div className="text-red-600">-{day.data.removed.toFixed(1)}gal</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Legend */}
              <div className="flex items-center justify-center space-x-6 text-xs text-gray-600 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded"></div>
                  <span>Days with activity</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-100 rounded"></div>
                  <span>Material added</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-100 rounded"></div>
                  <span>Compost taken</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Day Details Modal */}
      {showModal && selectedDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Activity for {new Date(selectedDay.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{selectedDay.submissions.length}</div>
                  <div className="text-sm text-gray-600">Total Submissions</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">+{selectedDay.totalAdded.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Pounds Added</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">-{selectedDay.totalRemoved.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Pounds Removed</div>
                </div>
              </div>

              {/* Submissions List */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Submissions</h4>
                <div className="space-y-3">
                  {selectedDay.submissions.map((submission) => (
                    <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium text-gray-900">{submission.user}</div>
                          <div className="text-sm text-gray-600">{submission.site}</div>
                          <div className="text-xs text-gray-500">ID: {submission.submissionId}</div>
                        </div>
                        <div className="text-sm text-gray-500">{submission.time}</div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {submission.tasks.map((task) => (
                          <span
                            key={task}
                            className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                          >
                            {task}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
