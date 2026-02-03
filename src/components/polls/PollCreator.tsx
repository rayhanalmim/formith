import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Clock, Eye, EyeOff, Target, Users, Timer } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart2, Plus, X, Smile } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

// Generate hours and minutes options
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

export interface PollData {
  question: string;
  pollType: 'single' | 'multiple';
  goal: string;
  options: { text: string; emoji: string }[];
  endsAt?: string;
}

interface PollCreatorProps {
  onPollCreate: (poll: PollData) => void;
  trigger?: React.ReactNode;
}

const EMOJI_LIST = ['📊', '✅', '❌', '👍', '👎', '❤️', '🔥', '💯', '🎉', '⭐', '🚀', '💡', '🤔', '😊', '😢', '😡'];

export function PollCreator({ onPollCreate, trigger }: PollCreatorProps) {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [question, setQuestion] = useState('');
  const [pollType, setPollType] = useState<'single' | 'multiple'>('single');
  const [goal, setGoal] = useState('');
  const [endsAt, setEndsAt] = useState<Date>();
  const [selectedHour, setSelectedHour] = useState('23');
  const [selectedMinute, setSelectedMinute] = useState('59');
  const [options, setOptions] = useState<{ text: string; emoji: string }[]>([
    { text: '', emoji: '' },
    { text: '', emoji: '' },
  ]);
  const [emojiPickerIndex, setEmojiPickerIndex] = useState<number | null>(null);

  // Filter valid options for preview
  const validOptions = options.filter(o => o.text.trim());
  const getFullExpirationDate = (): Date | undefined => {
    if (!endsAt) return undefined;
    const combined = new Date(endsAt);
    combined.setHours(parseInt(selectedHour), parseInt(selectedMinute), 0, 0);
    return combined;
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, { text: '', emoji: '' }]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, field: 'text' | 'emoji', value: string) => {
    const newOptions = [...options];
    newOptions[index][field] = value;
    setOptions(newOptions);
  };

  const handleSubmit = () => {
    if (!question.trim() || options.filter(o => o.text.trim()).length < 2) {
      return;
    }

    const fullExpirationDate = getFullExpirationDate();

    onPollCreate({
      question: question.trim(),
      pollType,
      goal: goal.trim(),
      endsAt: fullExpirationDate ? fullExpirationDate.toISOString() : undefined,
      options: options.filter(o => o.text.trim()),
    });

    // Reset form
    setQuestion('');
    setPollType('single');
    setGoal('');
    setEndsAt(undefined);
    setSelectedHour('23');
    setSelectedMinute('59');
    setOptions([{ text: '', emoji: '' }, { text: '', emoji: '' }]);
    setOpen(false);
  };

  const isValid = question.trim() && options.filter(o => o.text.trim()).length >= 2;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-primary/10">
            <BarChart2 className="h-5 w-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md glass-card max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-primary" />
            {language === 'ar' ? 'إنشاء استطلاع' : 'Create Poll'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto flex-1 px-1">
          {/* Question */}
          <div className="space-y-2">
            <Label>
              {language === 'ar' ? 'السؤال' : 'Question'}
            </Label>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={language === 'ar' ? 'اكتب سؤال الاستطلاع...' : 'Write your poll question...'}
              className="resize-none"
              rows={2}
            />
          </div>

          {/* Poll Type */}
          <div className="space-y-2">
            <Label>
              {language === 'ar' ? 'نوع الاستطلاع' : 'Poll Type'}
            </Label>
            <Select value={pollType} onValueChange={(v: 'single' | 'multiple') => setPollType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">
                  {language === 'ar' ? 'اختيار واحد' : 'Single Choice'}
                </SelectItem>
                <SelectItem value="multiple">
                  {language === 'ar' ? 'اختيارات متعددة' : 'Multiple Choice'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Goal */}
          <div className="space-y-2">
            <Label>
              {language === 'ar' ? 'الهدف (اختياري)' : 'Goal (optional)'}
            </Label>
            <Input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder={language === 'ar' ? 'ما هو هدف هذا الاستطلاع؟' : 'What is the goal of this poll?'}
            />
          </div>

          {/* Expiration Date & Time */}
          <div className="space-y-2">
            <Label>
              {language === 'ar' ? 'تاريخ ووقت الانتهاء (اختياري)' : 'Expiration Date & Time (Optional)'}
            </Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !endsAt && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="me-2 h-4 w-4" />
                    {endsAt ? format(endsAt, "PPP") : (
                      <span>{language === 'ar' ? 'اختر تاريخ' : 'Pick a date'}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endsAt}
                    onSelect={setEndsAt}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Picker */}
            {endsAt && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedHour} onValueChange={setSelectedHour}>
                  <SelectTrigger className="w-[80px]">
                    <SelectValue placeholder="HH" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {HOURS.map((hour) => (
                      <SelectItem key={hour} value={hour}>
                        {hour}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground font-bold">:</span>
                <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                  <SelectTrigger className="w-[80px]">
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent>
                    {MINUTES.map((minute) => (
                      <SelectItem key={minute} value={minute}>
                        {minute}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'الساعة' : 'Time'}
                </span>
              </div>
            )}

            {endsAt && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {language === 'ar' 
                    ? `ينتهي: ${format(getFullExpirationDate()!, "PPP")} الساعة ${selectedHour}:${selectedMinute}`
                    : `Ends: ${format(getFullExpirationDate()!, "PPP")} at ${selectedHour}:${selectedMinute}`
                  }
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEndsAt(undefined)}
                  className="text-xs h-6"
                >
                  {language === 'ar' ? 'إزالة' : 'Clear'}
                </Button>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-2">
            <Label>
              {language === 'ar' ? 'الخيارات' : 'Options'}
            </Label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Popover 
                    open={emojiPickerIndex === index} 
                    onOpenChange={(open) => setEmojiPickerIndex(open ? index : null)}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                      >
                        {option.emoji || <Smile className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                      <div className="grid grid-cols-8 gap-1">
                        {EMOJI_LIST.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            className="p-1 text-lg hover:bg-muted rounded"
                            onClick={() => {
                              updateOption(index, 'emoji', emoji);
                              setEmojiPickerIndex(null);
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Input
                    value={option.text}
                    onChange={(e) => updateOption(index, 'text', e.target.value)}
                    placeholder={`${language === 'ar' ? 'الخيار' : 'Option'} ${index + 1}`}
                    className="flex-1"
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                      onClick={() => removeOption(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 6 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="w-full"
              >
                <Plus className="h-4 w-4 me-2" />
                {language === 'ar' ? 'إضافة خيار' : 'Add Option'}
              </Button>
            )}
          </div>

          {/* Live Preview */}
          <Collapsible open={showPreview} onOpenChange={setShowPreview}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-between text-muted-foreground hover:text-foreground"
              >
                <span className="flex items-center gap-2">
                  {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {language === 'ar' ? 'معاينة الاستطلاع' : 'Poll Preview'}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {language === 'ar' ? 'مباشر' : 'Live'}
                </Badge>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="animate-accordion-down">
              <div className="mt-3 p-4 rounded-xl bg-muted/50 border border-border/50">
                {/* Poll Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">
                      {question.trim() || (language === 'ar' ? 'سؤالك هنا...' : 'Your question here...')}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {pollType === 'single' 
                      ? (language === 'ar' ? 'اختيار واحد' : 'Single') 
                      : (language === 'ar' ? 'متعدد' : 'Multiple')}
                  </Badge>
                </div>

                {/* Expiration Timer Preview */}
                {endsAt && (
                  <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg mb-2 bg-primary/10 text-primary">
                    <Timer className="h-4 w-4" />
                    <span className="font-medium">
                      {language === 'ar' 
                        ? `⏳ ينتهي: ${format(getFullExpirationDate()!, "PPP")}` 
                        : `⏳ Ends: ${format(getFullExpirationDate()!, "PPP")} at ${selectedHour}:${selectedMinute}`
                      }
                    </span>
                  </div>
                )}

                {/* Goal Preview */}
                {goal.trim() && (
                  <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                    <Target className="h-3 w-3" />
                    <span>{goal}</span>
                  </div>
                )}

                {/* Options Preview */}
                <div className="space-y-2">
                  {validOptions.length > 0 ? (
                    validOptions.map((option, index) => (
                      <div
                        key={index}
                        className="w-full rounded-lg border p-3 text-left transition-all hover:border-primary/50 hover:bg-primary/5"
                      >
                        <div className="flex items-center gap-2">
                          {option.emoji && <span className="text-lg">{option.emoji}</span>}
                          <span className="text-sm">{option.text}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="w-full rounded-lg border border-dashed p-3 text-center">
                        <span className="text-sm text-muted-foreground">
                          {language === 'ar' ? 'الخيار ١' : 'Option 1'}
                        </span>
                      </div>
                      <div className="w-full rounded-lg border border-dashed p-3 text-center">
                        <span className="text-sm text-muted-foreground">
                          {language === 'ar' ? 'الخيار ٢' : 'Option 2'}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Footer Preview */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>0 {language === 'ar' ? 'صوت' : 'votes'}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {language === 'ar' ? 'سجل دخولك للتصويت' : 'Login to vote'}
                  </span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <DialogFooter className="flex-shrink-0 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            {language === 'ar' ? 'إنشاء الاستطلاع' : 'Create Poll'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
