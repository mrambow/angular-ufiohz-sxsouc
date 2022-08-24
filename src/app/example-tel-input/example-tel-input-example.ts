import { FocusMonitor } from '@angular/cdk/a11y';
import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';
import { Component, ElementRef, Inject, Input, OnDestroy, Optional, QueryList, Self, ViewChildren } from '@angular/core';
import { AbstractControl, ControlValueAccessor, FormBuilder, FormControl, NgControl, Validators } from '@angular/forms';
import { MAT_FORM_FIELD, MatFormField, MatFormFieldControl } from '@angular/material/form-field';
import { Subject } from 'rxjs';

export class PinCode {
  constructor( public pin: string ) {
  }

  getSingleDigits(): string[] {
    return this.pin ? this.pin.split( '' ) : [
      '',
      '',
      '',
      '',
      '',
      '',
    ];
  }
}

/** Custom `MatFormFieldControl` for telephone number input. */
@Component( {
  selector: 'example-tel-input',
  templateUrl: 'example-tel-input-example.html',
  styleUrls: ['example-tel-input-example.css'],
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: MyTelInput,
    },
  ],
  host: {
    '[class.example-floating]': 'shouldLabelFloat',
    '[id]': 'id',
  },
} )
export class MyTelInput implements ControlValueAccessor, MatFormFieldControl<PinCode>, OnDestroy {

  private static nextId = 0;
  stateChanges = new Subject<void>();
  focused = false;
  touched = false;
  controlType = 'example-tel-input';
  id = `example-tel-input-${MyTelInput.nextId++}`;
  @Input( 'aria-describedby' ) userAriaDescribedBy: string;
  @ViewChildren( 'singleDigitInput' ) digitInputs: QueryList<ElementRef<HTMLInputElement>>;
  partsForm = this._formBuilder.group( MyTelInput.createFormControlsForPin() );
  autofilled?: boolean;

  constructor( private _formBuilder: FormBuilder,
    private _focusMonitor: FocusMonitor,
    private _elementRef: ElementRef<HTMLElement>,
    @Optional() @Inject( MAT_FORM_FIELD ) public _formField: MatFormField,
    @Optional() @Self() public ngControl: NgControl ) {
    if ( this.ngControl != null ) {
      this.ngControl.valueAccessor = this;
    }
  }

  get shouldLabelFloat() {
    return this.focused || !this.empty;
  }

  get errorState(): boolean {
    return this.partsForm.invalid && this.touched;
  }

  get formKeys(): string[] {
    return Object.keys( this.partsForm.controls );
  }

  get empty(): boolean {
    const {
      value: {
        pin0,
        pin1,
        pin2,
        pin3,
        pin4,
        pin5,
      },
    } = this.partsForm;

    return !pin0 && !pin1 && !pin2 && !pin3 && !pin4 && !pin5;
  }

  private _placeholder: string;

  @Input() get placeholder(): string {
    return this._placeholder;
  }

  set placeholder( value: string ) {
    this._placeholder = value;
    this.stateChanges.next();
  }

  private _required = false;

  @Input() get required(): boolean {
    return this._required;
  }

  set required( value: BooleanInput ) {
    this._required = coerceBooleanProperty( value );
    this.stateChanges.next();
  }

  private _disabled = false;

  @Input() get disabled(): boolean {
    return this._disabled;
  }

  set disabled( value: BooleanInput ) {
    this._disabled = coerceBooleanProperty( value );
    if ( this._disabled ) {
      this.partsForm.disable();
    } else {
      this.partsForm.enable();
    }
    this.stateChanges.next();
  }

  @Input() get value(): PinCode {
    if ( this.partsForm.valid ) {
      const {
        value: {
          pin0,
          pin1,
          pin2,
          pin3,
          pin4,
          pin5,
        },
      } = this.partsForm;
      return new PinCode( [
        pin0,
        pin1,
        pin2,
        pin3,
        pin4,
        pin5,
      ].join( '' ) );
    }
    return new PinCode( '' );
  }

  set value( pinCode: PinCode ) {
    const [pin0, pin1, pin2, pin3, pin4, pin5] = ( pinCode || new PinCode( '' ) ).getSingleDigits();
    this.partsForm.setValue( {
      pin0,
      pin1,
      pin2,
      pin3,
      pin4,
      pin5,
    } );
    // this.touched = true;
    this.stateChanges.next();
  }

  private static createFormControlsForPin( pinDigits = 6 ): Record<string, FormControl> {
    const formControls: Record<string, FormControl> = {};

    for ( let i = 0; i < pinDigits; i++ ) {
      formControls[`pin${i}`] = new FormControl(
        '',
        [
          Validators.required,
          Validators.minLength( 1 ),
          Validators.maxLength( 1 ),
        ] );
    }
    return formControls;
  }

  onFocusIn( event: FocusEvent ) {
    if ( !this.focused ) {
      this.focused = true;
      this.stateChanges.next();
    }
  }

  autoFocusPrev( control: AbstractControl, prevElement: HTMLInputElement ): void {
    if ( control.value.length < 1 ) {
      this._focusMonitor.focusVia(
        prevElement,
        'program' );
    }
  }

  setDescribedByIds( ids: string[] ) {
    try {
      const controlElement = this._elementRef.nativeElement.querySelector( '.example-tel-input-container' )!;
      controlElement.setAttribute(
        'aria-describedby',
        ids.join( ' ' ) );
    } catch {
    }
  }

  onContainerClick( event: MouseEvent ) {
    if ( ( event.target as Element ).tagName.toLowerCase() !== 'input' ) {
      this.digitInputs.first.nativeElement.focus();
    }
  }

  registerOnChange( fn: any ): void {
    this.onChange = fn;
  }

  // eslint-disable-next-line
  onChange = ( _: any ): void => {
  };

  // eslint-disable-next-line
  onTouched = () => {
  };

  ngOnDestroy(): void {
    this.stateChanges.complete();
    this._focusMonitor.stopMonitoring( this._elementRef );
  }

  pasteDataHandler( event: ClipboardEvent ): void {
    if ( event.clipboardData === null ) {
      return;
    }

    const pinFromClipboard = event.clipboardData.getData( 'text' )
      .trim();
    if ( !/\^d{6}$/.test( pinFromClipboard ) ) {
      return event.preventDefault();
    }
    this.value = new PinCode( pinFromClipboard );
    this.digitInputs.last.nativeElement.focus();
    this.stateChanges.next();
  }

  inputDataHandler( event: Event ): void {
    if ( event instanceof InputEvent ) {
      if ( event.inputType === 'deleteContentBackward' ) {
        return;
      }

      const indexOfCurrentInput = Number( ( event.target as HTMLInputElement ).dataset.index );
      const nextElement = this.digitInputs.get( indexOfCurrentInput + 1 );
      if ( nextElement ) {
        nextElement.nativeElement.focus();
      } else {
        this.onChange( this.value );
        this.stateChanges.next();
      }
    }
  }

  removeDigitsHandler( event: Event ): void {
    setTimeout(
      () => {
        const i = Number( ( event.target as HTMLInputElement ).dataset.index );
        this.digitInputs.get( i - 1 )
          ?.nativeElement
          .focus();
      },
      100 );
  }

  // eslint-disable-next-line
  onFocusOut( event: FocusEvent ) {
    if ( !this._elementRef.nativeElement.contains( event.relatedTarget as Element ) ) {
      this.touched = true;
      this.focused = false;
      this.onTouched();
      this.stateChanges.next();
    }
  }

  autoFocusNext( control: AbstractControl, nextElement?: HTMLInputElement ): void {
    if ( !control.errors && nextElement ) {
      this._focusMonitor.focusVia(
        nextElement,
        'program' );
    }
  }

  writeValue( tel: PinCode ): void {
    this.value = tel;
  }

  registerOnTouched( fn: never ): void {
    this.onTouched = fn;
  }

  setDisabledState( isDisabled: boolean ): void {
    this.disabled = isDisabled;
  }

  ariaLabel( index: number ): string {
    return index === 0 ? 'Bitte geben Sie den PIN ein. -stellig 1' : '-stellig ' + ( index + 1 );
  }
}
