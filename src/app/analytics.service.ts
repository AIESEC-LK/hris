import { Injectable } from '@angular/core';
import { AngularFireAnalytics } from '@angular/fire/compat/analytics';
import {AngularFireFunctions} from "@angular/fire/compat/functions";

interface EventSummaryRequest {
	id: string;
}

export interface EventSummary {
	event_name: string
	count: number
}

@Injectable({
	providedIn : 'root'
})
export class AnalyticsService {

	constructor(private analytics: AngularFireAnalytics, private functions: AngularFireFunctions) { }

	logEvent(eventName: string, properties: object) {
		this.analytics.logEvent(eventName, properties);
	}

	async getEventSummary(properties: EventSummaryRequest): Promise<EventSummary[]> {
		const eventSummary = this.functions.httpsCallable('analytics-getEventSummary');
		return await eventSummary(properties).toPromise();
	}
}
